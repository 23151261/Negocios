const pool = require('../config/db');
const { ensureLowStockOrders } = require('./data.controller');
const { enviarComprobanteFiscalEmail, DEFAULT_TARGET_EMAIL } = require('../utils/mailer');

async function procesarPago(req, res) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { metodo_pago, direccion, cart_session_key, reviewed_items } = req.body || {};
        const paymentMethodInput = typeof metodo_pago === 'string' ? metodo_pago.trim().toLowerCase() : 'tarjeta';
        const paymentMethods = {
            tarjeta: 'Tarjeta',
            'tarjeta de crédito / débito': 'Tarjeta',
            transferencia: 'Transferencia bancaria',
            'transferencia bancaria': 'Transferencia bancaria',
            paypal: 'PayPal',
            monedero: 'Monedero',
            ewallet: 'Monedero'
        };
        const paymentMethod = paymentMethods[paymentMethodInput];
        if (!paymentMethod) {
            await connection.rollback();
            return res.status(400).json({ error: 'Método de pago no válido' });
        }

        if (req.user && req.user.role !== 'usuario') {
            await connection.rollback();
            return res.status(403).json({ error: 'El checkout está disponible para clientes' });
        }

        // El identificador de cliente se toma del token, nunca del cuerpo del checkout.
        let clientRecord = null;
        let cId = null;
        if (req.user?.role === 'usuario') {
            cId = Number(req.user.id);
            const [clients] = await connection.query(
                'SELECT * FROM clientes WHERE id = ? FOR UPDATE',
                [cId]
            );
            if (clients.length === 0) {
                await connection.rollback();
                return res.status(403).json({ error: 'La cuenta no está asociada a un cliente' });
            }
            clientRecord = clients[0];
        }

        const sessionIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
        if (!clientRecord && (typeof cart_session_key !== 'string' || !sessionIdPattern.test(cart_session_key))) {
            await connection.rollback();
            return res.status(400).json({ error: 'La sesión del carrito no es válida' });
        }

        const cartSessionKey = clientRecord ? `client:${cId}` : `guest:${cart_session_key}`;
        const [cartRows] = await connection.query(`
            SELECT c.product_id, c.publication_id, c.quantity, c.marketplace,
                   p.name AS product_name, p.category AS product_category,
                   p.price AS product_price, p.stock AS product_stock,
                   p.status AS product_status, p.active AS product_active,
                   pub.nombre AS publication_name, pub.categoria AS publication_category,
                   pub.precio AS publication_price
            FROM carrito c
            LEFT JOIN productos p ON p.id = c.product_id AND c.marketplace = 0
            LEFT JOIN publicaciones pub ON pub.id = c.publication_id AND c.marketplace = 1
            WHERE c.session_key = ?
            ORDER BY c.id
            FOR UPDATE
        `, [cartSessionKey]);
        if (cartRows.length === 0 || cartRows.length > 100) {
            await connection.rollback();
            return res.status(400).json({ error: 'El carrito está vacío o contiene demasiados productos' });
        }
        if (!Array.isArray(reviewed_items) || reviewed_items.length !== cartRows.length) {
            await connection.rollback();
            return res.status(409).json({
                error: 'Actualiza el carrito y vuelve a revisar el total antes de pagar.'
            });
        }

        const items = [];
        for (let index = 0; index < cartRows.length; index += 1) {
            const row = cartRows[index];
            const quantity = Number(row.quantity);
            if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 1000) {
                await connection.rollback();
                return res.status(400).json({ error: 'La cantidad de un producto no es válida' });
            }

            const isMarketplace = Boolean(row.marketplace);
            const productId = Number(isMarketplace ? row.publication_id : row.product_id);
            const name = isMarketplace ? row.publication_name : row.product_name;
            const category = isMarketplace ? row.publication_category : row.product_category;
            const price = Number(isMarketplace ? row.publication_price : row.product_price);
            if (!Number.isSafeInteger(productId) || productId <= 0 || !name || !Number.isFinite(price) || price <= 0) {
                await connection.rollback();
                return res.status(409).json({ error: 'Un producto del carrito ya no está disponible' });
            }
            const reviewedItem = reviewed_items[index];
            if (
                !reviewedItem
                || reviewedItem.name !== name
                || Number(reviewedItem.quantity) !== quantity
                || !Number.isFinite(Number(reviewedItem.price))
                || Math.round(Number(reviewedItem.price) * 100) !== Math.round(price * 100)
            ) {
                await connection.rollback();
                return res.status(409).json({
                    error: 'Los productos o sus precios cambiaron. Actualiza el carrito y revisa el total antes de pagar.'
                });
            }
            if (!isMarketplace) {
                const stock = Number(row.product_stock);
                if (Number(row.product_active) !== 1 || row.product_status !== 'disponible' || stock < quantity) {
                    await connection.rollback();
                    return res.status(409).json({
                        error: `Existencia insuficiente o producto inactivo para "${name}". Stock disponible: ${stock}.`
                    });
                }
            }
            items.push({ productId, name, category, price, quantity, esMarketplace: isMarketplace });
        }

        const [activeTaxes] = await connection.query(
            "SELECT porcentaje FROM impuestos WHERE estado = 'Activo'"
        );
        const taxRate = activeTaxes.reduce((sum, tax) => sum + Number(tax.porcentaje || 0), 0);
        const [activePromotions] = await connection.query(`
            SELECT nombre, tipo_descuento, valor, descuento, productos
            FROM promociones
            WHERE estado IN ('Activa', 'Activo')
              AND (fecha_inicio IS NULL OR fecha_inicio <= CURDATE())
              AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())
        `);

        let baseSubtotal = 0;
        let discountedSubtotal = 0;
        for (const item of items) {
            const basePrice = item.price;
            const bestDiscount = activePromotions.reduce((best, promotion) => {
                const scope = String(promotion.productos || 'Todos').trim().toLowerCase();
                const appliesToAll = !scope || /\b(todo|todos|general|catalogo|catálogo)\b/.test(scope);
                const appliesToItem = appliesToAll
                    || scope.includes(item.name.toLowerCase())
                    || item.name.toLowerCase().includes(scope)
                    || (item.category && scope.includes(item.category.toLowerCase()));
                if (!appliesToItem) return best;

                const value = Number(promotion.valor || parseFloat(promotion.descuento) || 0);
                if (!Number.isFinite(value) || value <= 0) return best;
                const amount = promotion.tipo_descuento === 'monto'
                    ? Math.min(basePrice, value)
                    : basePrice * (Math.min(value, 100) / 100);
                return Math.max(best, amount);
            }, 0);

            item.price = Number((basePrice - bestDiscount).toFixed(2));
            item.subtotal = Number((item.price * item.quantity).toFixed(2));
            baseSubtotal += basePrice * item.quantity;
            discountedSubtotal += item.price * item.quantity;
        }

        const montoSubtotal = Number(discountedSubtotal.toFixed(2));
        const montoDescuento = Number((baseSubtotal - discountedSubtotal).toFixed(2));
        const montoImpuesto = Number((montoSubtotal * taxRate / 100).toFixed(2));
        const montoTotal = Number((montoSubtotal + montoImpuesto).toFixed(2));
        if (montoTotal <= 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'El total de la compra debe ser mayor a 0' });
        }

        const clientName = (clientRecord && clientRecord.name)
            || (direccion && typeof direccion.nombre === 'string' && direccion.nombre.trim())
            || 'Cliente';
        const clientEmail = (clientRecord && clientRecord.email)
            || (direccion && typeof direccion.email === 'string' && direccion.email.trim().toLowerCase())
            || '';
        const clientPhone = (clientRecord && clientRecord.phone)
            || (direccion && typeof direccion.telefono === 'string' && direccion.telefono.trim())
            || '';
        const clientAddress = (direccion && typeof direccion === 'object'
            ? [direccion.direccion, direccion.ciudad, direccion.cp ? `CP: ${direccion.cp}` : ''].filter(Boolean).join(', ')
            : '') || (clientRecord && clientRecord.address) || 'Mostrador';

        // 2. Si el pago es con Monedero, validar saldo suficiente
        let saldoAnteriorMonedero = null;
        let saldoNuevoMonedero = null;
        const esMonedero = paymentMethod === 'Monedero';

        if (esMonedero) {
            if (!clientRecord) {
                await connection.rollback();
                return res.status(400).json({ error: 'Debes iniciar sesión para pagar con tu Monedero' });
            }

            saldoAnteriorMonedero = Number(clientRecord.monedero_saldo || 0);
            if (saldoAnteriorMonedero < montoTotal) {
                await connection.rollback();
                return res.status(400).json({
                    error: `Saldo insuficiente en tu Monedero. Tienes $${saldoAnteriorMonedero.toFixed(2)} y el total es de $${montoTotal.toFixed(2)}.`
                });
            }

            saldoNuevoMonedero = Number((saldoAnteriorMonedero - montoTotal).toFixed(2));
        }

        // 4. Generar Folio oficial de la orden (ej: OR-00648)
        const [[maxOrder]] = await connection.query('SELECT COUNT(*) AS totalOrders FROM pedidos');
        const orderNumber = (maxOrder.totalOrders || 0) + 1;
        const folioPadded = String(orderNumber).padStart(5, '0');
        const orderFolio = `OR-${folioPadded}`;
        const orderId = orderFolio;

        // 5. Insertar en tabla `pedidos` y `pedido_items`
        await connection.query(`
            INSERT INTO pedidos (id, cliente_id, client_name, total, status, payment_method, order_date, source, address)
            VALUES (?, ?, ?, ?, 'Procesada', ?, NOW(), 'online', ?)
        `, [
            orderId,
            cId || null,
            clientName,
            montoTotal,
            paymentMethod,
            typeof direccion === 'object' ? JSON.stringify(direccion) : JSON.stringify({ nombre: clientName, email: clientEmail, direccion: clientAddress })
        ]);

        for (const item of items) {
            const prodId = item.esMarketplace ? null : item.productId;
            const name = item.name;
            const qty = item.quantity;
            const price = item.price;
            const itemSubtotal = Number((price * qty).toFixed(2));

            await connection.query(`
                INSERT INTO pedido_items (pedido_id, product_id, name, quantity, price, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [orderId, prodId, name, qty, price, itemSubtotal]);
        }

        // 6. Integración ERP: Insertar en `ordenes_erp` y `orden_items_erp`
        const [erpOrderResult] = await connection.query(`
            INSERT INTO ordenes_erp (folio, fecha, cliente_id, client_name, client_email, client_phone, client_company, total, subtotal, estado, usuario_id, usuario_name, notas)
            VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, 'Procesada', ?, ?, ?)
        `, [
            orderFolio,
            cId || null,
            clientName,
            clientEmail,
            clientPhone,
            (clientRecord && clientRecord.company) || '',
            montoTotal,
            montoSubtotal,
            cId || null,
            clientName,
            `Pedido tienda online pagado con ${paymentMethod}. Descuento: $${montoDescuento.toFixed(2)}. Impuestos: $${montoImpuesto.toFixed(2)}`
        ]);

        const erpOrderId = erpOrderResult.insertId;

        for (const item of items) {
            const prodId = item.esMarketplace ? null : item.productId;
            const name = item.name;
            const qty = item.quantity;
            const price = item.price;
            const itemSubtotal = Number((price * qty).toFixed(2));

            if (prodId) {
                await connection.query(`
                    INSERT INTO orden_items_erp (orden_id, product_id, product_name, quantity, unit_price, subtotal)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [erpOrderId, prodId, name, qty, price, itemSubtotal]);
            }
        }

        // 7. Integración SCM: Descontar stock y registrar movimiento de inventario
        const fechaHoyStr = new Date().toLocaleDateString('es-MX');
        for (const item of items) {
            const prodId = item.productId;
            const qty = item.quantity;
            const name = item.name;

            if (Number.isSafeInteger(prodId) && prodId > 0 && !item.esMarketplace) {
                await connection.query(`
                    UPDATE productos 
                    SET stock = GREATEST(0, stock - ?),
                        status = IF(stock - ? <= 0, 'agotado', 'disponible')
                    WHERE id = ?
                `, [qty, qty, prodId]);

                await connection.query(`
                    INSERT INTO movimientos_inventario (date, product_id, product_name, type, quantity, reason, user)
                    VALUES (?, ?, ?, 'Salida', ?, ?, ?)
                `, [
                    fechaHoyStr,
                    prodId,
                    name,
                    -qty,
                    `Venta por tienda online / Carrito (${orderFolio})`,
                    clientName
                ]);
            }
        }

        // Ejecutar reposición automática SCM si aplica
        await ensureLowStockOrders(connection);

        // 8. Integración Monedero: Descontar y registrar movimiento
        if (esMonedero && clientRecord) {
            await connection.query(
                'UPDATE clientes SET monedero_saldo = ? WHERE id = ?',
                [saldoNuevoMonedero, clientRecord.id]
            );

            await connection.query(`
                INSERT INTO monedero_movimientos (cliente_id, folio, fecha, concepto, tipo, monto, saldo, metodo_pago)
                VALUES (?, ?, NOW(), ?, 'cargo', ?, ?, 'Monedero')
            `, [
                clientRecord.id,
                orderFolio,
                `Compra (${orderFolio})`,
                -montoTotal,
                saldoNuevoMonedero
            ]);
        }

        // 9. Registrar Pago en tabla `pagos`
        await connection.query(`
            INSERT INTO pagos (pedido_id, cliente_id, monto, metodo_pago, estado, fecha)
            VALUES (?, ?, ?, ?, 'Aprobado', NOW())
        `, [
            orderId,
            cId || null,
            montoTotal,
            paymentMethod
        ]);

        // 10. Integración CRM: Actualizar métricas del cliente e historial
        if (clientRecord) {
            const newOrdersCount = Number(clientRecord.orders || 0) + 1;
            const newSpent = Number((Number(clientRecord.spent || 0) + montoTotal).toFixed(2));
            const newStage = newOrdersCount >= 3 ? 'frecuente' : 'activo';

            await connection.query(`
                UPDATE clientes 
                SET orders = ?, spent = ?, stage = ?, last_interaction_date = CURDATE()
                WHERE id = ?
            `, [newOrdersCount, newSpent, newStage, clientRecord.id]);

            await connection.query(`
                INSERT INTO interacciones (cliente_id, type, date, note, user)
                VALUES (?, 'compra', CURDATE(), ?, ?)
            `, [
                clientRecord.id,
                `Compra registrada por $${montoTotal.toFixed(2)} (${paymentMethod}). Folio: ${orderFolio}`,
                clientEmail
            ]);
        }

        // 11. Vaciar carrito en base de datos
        await connection.query('DELETE FROM carrito WHERE session_key = ?', [cartSessionKey]);

        await connection.commit();

        // 12. Enviar automáticamente el comprobante fiscal por correo a pailoto0717@gmail.com
        let emailFiscalResult = { success: false, destinatario: DEFAULT_TARGET_EMAIL };
        try {
            emailFiscalResult = await enviarComprobanteFiscalEmail({
                folio: orderFolio,
                fecha: new Date().toLocaleString('es-MX'),
                cliente: {
                    nombre: clientName,
                    email: clientEmail,
                    telefono: clientPhone,
                    direccion: clientAddress
                },
                datosFiscales: {
                    rfc: 'XAXX010101000',
                    razonSocial: clientName,
                    regimen: '616 - General / Régimen de Incorporación',
                    uso: 'G03 - Gastos en general'
                },
                items: items,
                subtotal: montoSubtotal,
                impuesto: montoImpuesto,
                descuento: montoDescuento,
                total: montoTotal,
                metodoPago: paymentMethod,
                saldoActualMonedero: esMonedero ? saldoNuevoMonedero : null
            });
        } catch (mailErr) {
            console.error('Error al enviar correo del comprobante fiscal:', mailErr);
        }

        res.json({
            success: true,
            message: '¡Compra realizada con éxito!',
            orden: orderFolio,
            orderId: orderFolio,
            pago: paymentMethod,
            subtotal: montoSubtotal,
            impuesto: montoImpuesto,
            descuento: montoDescuento,
            total: montoTotal,
            saldo_anterior: saldoAnteriorMonedero,
            saldo_actual: saldoNuevoMonedero,
            es_monedero: esMonedero,
            cliente_nombre: clientName,
            cliente_email: clientEmail,
            fecha: new Date().toLocaleString('es-MX'),
            email_fiscal_enviado: emailFiscalResult.success,
            email_fiscal_destinatario: emailFiscalResult.destinatario || DEFAULT_TARGET_EMAIL,
            items
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al procesar pago y compra:', error);
        res.status(500).json({ error: error.message || 'Error al procesar el pago' });
    } finally {
        connection.release();
    }
}

async function enviarComprobanteFiscal(req, res) {
    try {
        const {
            folio,
            fecha,
            cliente,
            datosFiscales,
            items,
            subtotal,
            impuesto,
            descuento,
            total,
            metodoPago,
            saldoActualMonedero
        } = req.body || {};

        if (!folio) {
            return res.status(400).json({ error: 'El folio es requerido para enviar el comprobante' });
        }

        const result = await enviarComprobanteFiscalEmail({
            folio,
            fecha: fecha || new Date().toLocaleString('es-MX'),
            cliente: cliente || {},
            datosFiscales: datosFiscales || {},
            items: Array.isArray(items) ? items : [],
            subtotal: Number(subtotal || 0),
            impuesto: Number(impuesto || 0),
            descuento: Number(descuento || 0),
            total: Number(total || 0),
            metodoPago: metodoPago || 'Tarjeta',
            saldoActualMonedero: saldoActualMonedero !== undefined ? Number(saldoActualMonedero) : null
        });

        return res.status(result.success ? 200 : 503).json({
            success: result.success,
            message: result.success
                ? `Comprobante fiscal enviado exitosamente a ${result.destinatario}`
                : `No se pudo enviar el correo: ${result.error || 'Error SMTP'}`,
            destinatario: result.destinatario,
            error: result.success ? undefined : result.error
        });
    } catch (error) {
        console.error('Error en endpoint enviarComprobanteFiscal:', error);
        res.status(500).json({ error: 'Error al enviar comprobante fiscal por correo' });
    }
}

async function getPagos(req, res) {
    try {
        const [rows] = await pool.query(`
            SELECT p.id, p.pedido_id, p.cliente_id, p.monto, p.metodo_pago, p.estado, p.fecha,
                   COALESCE(c.name, ord.client_name, 'Cliente') AS cliente_nombre,
                   COALESCE(c.email, ord.client_email, '') AS cliente_email
            FROM pagos p
            LEFT JOIN clientes c ON c.id = p.cliente_id
            LEFT JOIN ordenes_erp ord ON ord.folio = p.pedido_id
            ORDER BY p.id DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al listar pagos:', error);
        res.status(500).json({ error: 'Error al consultar pagos' });
    }
}

async function getPagoById(req, res) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM pagos WHERE id = ? OR pedido_id = ?', [id, id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener pago:', error);
        res.status(500).json({ error: 'Error al consultar detalle del pago' });
    }
}

module.exports = {
    procesarPago,
    enviarComprobanteFiscal,
    getPagos,
    getPagoById
};
