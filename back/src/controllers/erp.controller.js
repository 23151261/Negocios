const pool = require('../config/db');
const { ensureLowStockOrders } = require('./data.controller');

/**
 * Inicializa las tablas de ERP en la base de datos MySQL
 * y siembra datos iniciales de prueba si no existen órdenes.
 */
async function initErpDatabase() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Tabla de órdenes de clientes ERP
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ordenes_erp (
                id INT AUTO_INCREMENT PRIMARY KEY,
                folio VARCHAR(30) NOT NULL UNIQUE,
                fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                cliente_id INT NOT NULL,
                client_name VARCHAR(150) NOT NULL,
                client_email VARCHAR(150) DEFAULT '',
                client_phone VARCHAR(50) DEFAULT '',
                client_company VARCHAR(150) DEFAULT '',
                total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                estado ENUM('Procesada', 'Procesando', 'Completada', 'Cancelada') NOT NULL DEFAULT 'Procesada',
                usuario_id INT NULL,
                usuario_name VARCHAR(100) DEFAULT 'Administrador',
                notas TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_ordenes_erp_cliente (cliente_id),
                INDEX idx_ordenes_erp_estado (estado),
                FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // 2. Tabla de detalles/items de la orden ERP
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orden_items_erp (
                id INT AUTO_INCREMENT PRIMARY KEY,
                orden_id INT NOT NULL,
                product_id INT NOT NULL,
                product_name VARCHAR(150) NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                INDEX idx_items_erp_orden (orden_id),
                INDEX idx_items_erp_prod (product_id),
                FOREIGN KEY (orden_id) REFERENCES ordenes_erp(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES productos(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // 3. Estado de madurez del ERP en app_data
        const defaultErpState = {
            nivel: 'Integrado',
            descripcion: 'Los módulos de CRM, SCM y ERP se encuentran integrados y funcionando de manera coordinada.',
            checklist: [
                { id: 'chk-crm', label: 'Clientes integrados (CRM)', completed: true },
                { id: 'chk-scm', label: 'Productos e inventario (SCM)', completed: true },
                { id: 'chk-erp', label: 'Órdenes de clientes funcionando (ERP)', completed: true },
                { id: 'chk-mov', label: 'Movimientos de inventario automáticos', completed: true },
                { id: 'chk-rep', label: 'Reportes empresariales completos', completed: true },
                { id: 'chk-opt', label: 'Procesos optimizados', completed: false }
            ]
        };

        await connection.query(
            'INSERT IGNORE INTO app_data (data_key, data_value) VALUES (?, ?)',
            ['erp_state', JSON.stringify(defaultErpState)]
        );

        await connection.commit();
    } catch (err) {
        await connection.rollback();
        console.error('Error inicializando tablas ERP:', err);
        throw err;
    } finally {
        connection.release();
    }
}

// ─────────────────────────────────────────────────────────────
// CONTROLADOR DE ÓRDENES ERP
// ─────────────────────────────────────────────────────────────

/**
 * Obtener listado de todas las órdenes ERP
 * Une con la tabla clientes y productos para reflejar automáticamente cualquier edición
 */
async function getOrders(req, res) {
    try {
        const [orders] = await pool.query(`
            SELECT o.*,
                   COALESCE(c.name, o.client_name) AS client_name,
                   COALESCE(c.email, o.client_email) AS client_email,
                   COALESCE(c.phone, o.client_phone) AS client_phone,
                   COALESCE(c.company, o.client_company) AS client_company,
                   DATE_FORMAT(o.fecha, '%d/%m/%Y %H:%i') AS fecha_formateada,
                   DATE_FORMAT(o.fecha, '%d/%m/%Y') AS fecha_corta
            FROM ordenes_erp o
            LEFT JOIN clientes c ON c.id = o.cliente_id
            ORDER BY o.id DESC
        `);

        const [items] = await pool.query(`
            SELECT i.*, COALESCE(p.name, i.product_name) AS product_name
            FROM orden_items_erp i
            LEFT JOIN productos p ON p.id = i.product_id
            ORDER BY i.id
        `);

        const ordersWithItems = orders.map(ord => ({
            ...ord,
            total: Number(ord.total),
            subtotal: Number(ord.subtotal),
            items: items.filter(it => it.orden_id === ord.id).map(it => ({
                id: it.id,
                productId: it.product_id,
                name: it.product_name,
                quantity: Number(it.quantity),
                unitPrice: Number(it.unit_price),
                subtotal: Number(it.subtotal)
            }))
        }));

        res.json(ordersWithItems);
    } catch (error) {
        console.error('Error al obtener órdenes ERP:', error);
        res.status(500).json({ error: 'Error interno al consultar órdenes de clientes' });
    }
}

/**
 * Obtener detalle de una orden ERP por ID
 */
async function getOrderById(req, res) {
    try {
        const orderId = Number(req.params.id);
        const [rows] = await pool.query(`
            SELECT o.*,
                   COALESCE(c.name, o.client_name) AS client_name,
                   COALESCE(c.email, o.client_email) AS client_email,
                   COALESCE(c.phone, o.client_phone) AS client_phone,
                   COALESCE(c.company, o.client_company) AS client_company,
                   DATE_FORMAT(o.fecha, '%d/%m/%Y %H:%i') AS fecha_formateada,
                   DATE_FORMAT(o.fecha, '%d/%m/%Y') AS fecha_corta
            FROM ordenes_erp o
            LEFT JOIN clientes c ON c.id = o.cliente_id
            WHERE o.id = ?
        `, [orderId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        const [items] = await pool.query(`
            SELECT i.*, COALESCE(p.name, i.product_name) AS product_name
            FROM orden_items_erp i
            LEFT JOIN productos p ON p.id = i.product_id
            WHERE i.orden_id = ?
            ORDER BY i.id
        `, [orderId]);

        res.json({
            ...rows[0],
            total: Number(rows[0].total),
            subtotal: Number(rows[0].subtotal),
            items: items.map(it => ({
                id: it.id,
                productId: it.product_id,
                name: it.product_name,
                quantity: Number(it.quantity),
                unitPrice: Number(it.unit_price),
                subtotal: Number(it.subtotal)
            }))
        });
    } catch (error) {
        console.error('Error al obtener detalle de orden ERP:', error);
        res.status(500).json({ error: 'Error interno al consultar la orden' });
    }
}

/**
 * Crear y procesar una orden de cliente ERP
 * Integra CRM (cliente) + SCM (productos/stock/movimientos) + ERP (orden/indicadores)
 */
async function createOrder(req, res) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { clienteId, items, notas } = req.body;
        const crmClientId = Number(clienteId);

        if (!Number.isSafeInteger(crmClientId) || crmClientId <= 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Debes seleccionar un cliente del CRM' });
        }

        if (!Array.isArray(items) || items.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'La orden debe contener al menos un producto' });
        }

        // 1. Obtener cliente de la base de datos
        const [clients] = await connection.query('SELECT * FROM clientes WHERE id = ?', [crmClientId]);
        if (clients.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Cliente no encontrado en el sistema CRM' });
        }
        const client = clients[0];

        // 2. Validar stock de todos los productos y calcular totales
        let total = 0;
        const verifiedItems = [];
        const requestedItems = new Map();

        for (const item of items) {
            const prodId = Number(item?.productId ?? item?.id);
            const qty = Number(item?.quantity ?? 1);

            if (
                !Number.isSafeInteger(prodId) || prodId <= 0 ||
                !Number.isSafeInteger(qty) || qty <= 0
            ) {
                await connection.rollback();
                return res.status(400).json({ error: 'Cantidad o producto no válido' });
            }

            const combinedQuantity = (requestedItems.get(prodId) || 0) + qty;
            if (!Number.isSafeInteger(combinedQuantity) || combinedQuantity > 2147483647) {
                await connection.rollback();
                return res.status(400).json({ error: 'La cantidad solicitada no es válida' });
            }
            requestedItems.set(prodId, combinedQuantity);
        }

        for (const [prodId, qty] of requestedItems) {
            const [prods] = await connection.query('SELECT * FROM productos WHERE id = ? AND active = 1 FOR UPDATE', [prodId]);
            if (prods.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: `Producto con ID ${prodId} no existe o no está activo` });
            }
            const product = prods[0];

            if (Number(product.stock) < qty) {
                await connection.rollback();
                return res.status(400).json({
                    error: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${qty}`
                });
            }

            const unitPrice = Number(product.price);
            const subtotal = Number((unitPrice * qty).toFixed(2));
            total += subtotal;

            verifiedItems.push({
                product,
                quantity: qty,
                unitPrice,
                subtotal
            });
        }

        total = Number(total.toFixed(2));

        // 3. Generar nuevo Folio correlativo OR-XXX
        const [[{ maxNum }]] = await connection.query(`
            SELECT COALESCE(MAX(CAST(SUBSTRING(folio, 4) AS UNSIGNED)), 0) AS maxNum
            FROM ordenes_erp
            WHERE folio REGEXP '^OR-[0-9]+$'
        `);
        const nextFolioNum = maxNum + 1;
        const folio = `OR-${String(nextFolioNum).padStart(3, '0')}`;

        // 4. Determinar usuario responsable
        const actorName = req.user?.name || req.user?.email || 'Administrador';
        const actorId = req.user?.id || null;

        // 5. Insertar en tabla ordenes_erp
        const [insertOrd] = await connection.query(`
            INSERT INTO ordenes_erp
            (folio, fecha, cliente_id, client_name, client_email, client_phone, client_company, total, subtotal, estado, usuario_id, usuario_name, notas)
            VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, 'Procesada', ?, ?, ?)
        `, [
            folio,
            client.id,
            client.name,
            client.email || '',
            client.phone || '',
            client.company || '',
            total,
            total,
            actorId,
            actorName,
            notas || ''
        ]);

        const ordenId = insertOrd.insertId;

        // 6. Insertar items, descontar stock en productos y registrar movimiento en inventario (SCM)
        const dateStr = new Date().toLocaleDateString('es-MX');

        for (const item of verifiedItems) {
            // Guardar item en orden_items_erp
            await connection.query(`
                INSERT INTO orden_items_erp
                (orden_id, product_id, product_name, quantity, unit_price, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                ordenId,
                item.product.id,
                item.product.name,
                item.quantity,
                item.unitPrice,
                item.subtotal
            ]);

            // Descontar stock en productos
            await connection.query(`
                UPDATE productos
                SET stock = stock - ?
                WHERE id = ?
            `, [item.quantity, item.product.id]);

            // Registrar movimiento de Salida en inventario SCM
            await connection.query(`
                INSERT INTO movimientos_inventario
                (date, product_id, product_name, type, quantity, reason, user)
                VALUES (?, ?, ?, 'Salida', ?, ?, ?)
            `, [
                dateStr,
                item.product.id,
                item.product.name,
                -Math.abs(item.quantity),
                `Venta ERP - Orden ${folio} (Cliente: ${client.name})`,
                actorName
            ]);
        }

        // 7. Actualizar cliente en CRM (acumular orden y gasto total)
        await connection.query(`
            UPDATE clientes
            SET orders = orders + 1,
                spent = spent + ?,
                stage = CASE WHEN stage = 'prospecto' THEN 'activo' ELSE stage END,
                last_interaction_date = CURDATE()
            WHERE id = ?
        `, [total, client.id]);

        // 8. Registrar interacción en CRM para historial del cliente
        await connection.query(`
            INSERT INTO interacciones
            (cliente_id, type, date, note, user, usuario_id)
            VALUES (?, 'compra', CURDATE(), ?, ?, ?)
        `, [
            client.id,
            `Orden de cliente ERP generada con folio ${folio} por un total de $${total.toFixed(2)}`,
            actorName,
            actorId
        ]);

        // 9. Re-evaluar reposición automática PUSH en SCM si aplica
        await ensureLowStockOrders(connection);

        await connection.commit();

        res.status(201).json({
            message: 'Orden creada y procesada con éxito',
            orden: {
                id: ordenId,
                folio,
                fecha: new Date(),
                cliente: client.name,
                clienteId: client.id,
                empresa: client.company,
                total,
                estado: 'Procesada',
                itemsCount: verifiedItems.length
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al crear orden ERP:', error);
        res.status(500).json({ error: error.message || 'Error al procesar la orden' });
    } finally {
        connection.release();
    }
}

/**
 * Actualizar orden ERP (estado, notas) con sincronización bidireccional inmediata:
 * - Si se cancela: devuelve stock a productos (SCM), registra 'Entrada' en movimientos_inventario,
 *   y descuenta órdenes/gasto en clientes (CRM) registrando nota en interacciones.
 * - Si se reactiva (de cancelada a activa): descuenta stock, registra 'Salida',
 *   y suma órdenes/gasto en clientes (CRM).
 */
async function updateOrder(req, res) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const orderId = Number(req.params.id);
        const { estado, notas } = req.body;

        const [orders] = await connection.query('SELECT * FROM ordenes_erp WHERE id = ? FOR UPDATE', [orderId]);
        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Orden no encontrada' });
        }
        const currentOrder = orders[0];

        const validStates = ['Procesada', 'Procesando', 'Completada', 'Cancelada'];
        const targetEstado = estado || currentOrder.estado;
        if (!validStates.includes(targetEstado)) {
            await connection.rollback();
            return res.status(400).json({ error: 'Estado no válido' });
        }

        const dateStr = new Date().toLocaleDateString('es-MX');
        const actorName = req.user?.name || req.user?.email || 'Administrador';
        const actorId = req.user?.id || null;

        // 1. Si cambia a Cancelada desde un estado activo
        if (targetEstado === 'Cancelada' && currentOrder.estado !== 'Cancelada') {
            const [items] = await connection.query('SELECT * FROM orden_items_erp WHERE orden_id = ?', [orderId]);
            for (const it of items) {
                await connection.query('UPDATE productos SET stock = stock + ? WHERE id = ?', [it.quantity, it.product_id]);
                await connection.query(`
                    INSERT INTO movimientos_inventario (date, product_id, product_name, type, quantity, reason, user)
                    VALUES (?, ?, ?, 'Entrada', ?, ?, ?)
                `, [
                    dateStr,
                    it.product_id,
                    it.product_name,
                    it.quantity,
                    `Cancelación de Orden ERP ${currentOrder.folio}`,
                    actorName
                ]);
            }

            // Sincronizar en CRM: descontar orden y gasto acumulado del cliente
            await connection.query(`
                UPDATE clientes
                SET orders = GREATEST(0, orders - 1),
                    spent = GREATEST(0.00, spent - ?)
                WHERE id = ?
            `, [currentOrder.total, currentOrder.cliente_id]);

            // Registrar interacción de cancelación en CRM
            await connection.query(`
                INSERT INTO interacciones (cliente_id, type, date, note, user, usuario_id)
                VALUES (?, 'nota', CURDATE(), ?, ?, ?)
            `, [
                currentOrder.cliente_id,
                `Orden ERP ${currentOrder.folio} fue cancelada. Se devolvió stock al inventario e importe de $${Number(currentOrder.total).toFixed(2)}.`,
                actorName,
                actorId
            ]);
        }
        // 2. Si cambia de Cancelada a un estado activo (reactivación)
        else if (currentOrder.estado === 'Cancelada' && targetEstado !== 'Cancelada') {
            const [items] = await connection.query('SELECT * FROM orden_items_erp WHERE orden_id = ?', [orderId]);
            // Validar stock antes de reactivar
            for (const it of items) {
                const [[prod]] = await connection.query('SELECT stock, name FROM productos WHERE id = ? FOR UPDATE', [it.product_id]);
                if (prod && Number(prod.stock) < it.quantity) {
                    await connection.rollback();
                    return res.status(400).json({
                        error: `No hay suficiente stock para reactivar. "${prod.name}" disponible: ${prod.stock}, requerido: ${it.quantity}`
                    });
                }
            }

            for (const it of items) {
                await connection.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [it.quantity, it.product_id]);
                await connection.query(`
                    INSERT INTO movimientos_inventario (date, product_id, product_name, type, quantity, reason, user)
                    VALUES (?, ?, ?, 'Salida', ?, ?, ?)
                `, [
                    dateStr,
                    it.product_id,
                    it.product_name,
                    -Math.abs(it.quantity),
                    `Reactivación de Orden ERP ${currentOrder.folio}`,
                    actorName
                ]);
            }

            // Sincronizar en CRM: volver a sumar orden y gasto acumulado
            await connection.query(`
                UPDATE clientes
                SET orders = orders + 1,
                    spent = spent + ?
                WHERE id = ?
            `, [currentOrder.total, currentOrder.cliente_id]);

            // Registrar interacción en CRM
            await connection.query(`
                INSERT INTO interacciones (cliente_id, type, date, note, user, usuario_id)
                VALUES (?, 'compra', CURDATE(), ?, ?, ?)
            `, [
                currentOrder.cliente_id,
                `Orden ERP ${currentOrder.folio} fue reactivada (${targetEstado}). Total: $${Number(currentOrder.total).toFixed(2)}.`,
                actorName,
                actorId
            ]);
        }

        const updateNotas = notas !== undefined ? notas : currentOrder.notas;
        await connection.query(
            'UPDATE ordenes_erp SET estado = ?, notas = ? WHERE id = ?',
            [targetEstado, updateNotas, orderId]
        );

        // Re-evaluar PUSH en SCM si aplica
        await ensureLowStockOrders(connection);

        await connection.commit();

        res.json({
            message: 'Orden actualizada correctamente',
            estado: targetEstado,
            notas: updateNotas
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al actualizar orden ERP:', error);
        res.status(500).json({ error: error.message || 'Error al actualizar la orden' });
    } finally {
        connection.release();
    }
}

async function updateOrderStatus(req, res) {
    return updateOrder(req, res);
}

/**
 * Obtener métricas e indicadores clave de ERP
 * (Dashboard general e integración CRM + SCM + ERP)
 */
async function getMetrics(req, res) {
    try {
        // 1. Clientes activos (del CRM)
        const [[{ clientesActivos }]] = await pool.query(
            "SELECT COUNT(*) AS clientesActivos FROM clientes WHERE status = 'activo'"
        );

        // 2. Órdenes de clientes (del ERP)
        const [[{ totalOrdenes }]] = await pool.query(
            'SELECT COUNT(*) AS totalOrdenes FROM ordenes_erp'
        );

        // 3. Ventas totales (de órdenes no canceladas)
        const [[{ ventasTotales }]] = await pool.query(`
            SELECT COALESCE(SUM(total), 0) AS ventasTotales
            FROM ordenes_erp
            WHERE estado != 'Cancelada'
        `);

        // 4. Total de productos vendidos
        const [[{ productosVendidos }]] = await pool.query(`
            SELECT COALESCE(SUM(i.quantity), 0) AS productosVendidos
            FROM orden_items_erp i
            INNER JOIN ordenes_erp o ON o.id = i.orden_id
            WHERE o.estado != 'Cancelada'
        `);

        // 5. Productos más vendidos (Top ranking - reflejando nombres actuales de productos)
        const [topProducts] = await pool.query(`
            SELECT COALESCE(p.name, i.product_name) AS name,
                   SUM(i.quantity) AS cantidad,
                   SUM(i.subtotal) AS total
            FROM orden_items_erp i
            INNER JOIN ordenes_erp o ON o.id = i.orden_id
            LEFT JOIN productos p ON p.id = i.product_id
            WHERE o.estado != 'Cancelada'
            GROUP BY COALESCE(p.name, i.product_name)
            ORDER BY cantidad DESC
            LIMIT 5
        `);

        // Si hay menos de 4, completar con platillos populares del restaurante para poblar gráficos
        if (topProducts.length < 4) {
            const [otherProds] = await pool.query(`
                SELECT name, 0 AS cantidad, 0 AS total
                FROM productos
                WHERE active = 1 AND name NOT IN (?)
                LIMIT ?
            `, [topProducts.map(p => p.name).concat(['']), 4 - topProducts.length]);

            otherProds.forEach(p => topProducts.push(p));
        }

        // 6. Ventas últimos 6 meses (para la gráfica de barras)
        const [salesMonthly] = await pool.query(`
            SELECT DATE_FORMAT(fecha, '%b') AS mes,
                   DATE_FORMAT(fecha, '%Y-%m') AS ym,
                   COALESCE(SUM(total), 0) AS monto
            FROM ordenes_erp
            WHERE estado != 'Cancelada' AND fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY ym, mes
            ORDER BY ym ASC
        `);

        // Mapear últimos 6 meses en español si faltan datos
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const now = new Date();
        const sixMonths = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mLabel = monthNames[d.getMonth()];
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const found = salesMonthly.find(s => s.ym === monthKey);
            sixMonths.push({
                mes: mLabel,
                monto: found ? Number(found.monto) : 0
            });
        }

        // 7. Inventario disponible por nivel de rotación (Dona / pastel)
        const [prodsInventory] = await pool.query(`
            SELECT id, name, stock, min_stock, strategy FROM productos WHERE active = 1
        `);

        let altaRotacion = 0;
        let rotacionMedia = 0;
        let rotacionBaja = 0;

        prodsInventory.forEach(p => {
            const stock = Number(p.stock);
            if (stock <= 8) altaRotacion++;
            else if (stock <= 20) rotacionMedia++;
            else rotacionBaja++;
        });

        const totalInventarioUnidades = prodsInventory.reduce((acc, p) => acc + Number(p.stock), 0);

        res.json({
            clientesActivos: Number(clientesActivos),
            ordenesClientes: Number(totalOrdenes),
            ventasTotales: Number(Number(ventasTotales).toFixed(2)),
            productosVendidos: Number(productosVendidos),
            totalInventarioUnidades,
            ventasPorMes: sixMonths,
            productosMasVendidos: topProducts.map(p => ({
                name: p.name,
                cantidad: Number(p.cantidad),
                total: Number(p.total)
            })),
            rotacionInventario: {
                altaRotacion,
                rotacionMedia,
                rotacionBaja
            }
        });
    } catch (error) {
        console.error('Error al obtener métricas ERP:', error);
        res.status(500).json({ error: 'Error al generar indicadores ERP' });
    }
}

/**
 * Obtener estado de adopción / madurez del ERP
 */
async function getErpState(req, res) {
    try {
        const [rows] = await pool.query("SELECT data_value FROM app_data WHERE data_key = 'erp_state'");
        if (rows.length && rows[0].data_value) {
            const val = typeof rows[0].data_value === 'string' ? JSON.parse(rows[0].data_value) : rows[0].data_value;
            return res.json(val);
        }
        res.json({
            nivel: 'Integrado',
            descripcion: 'Los módulos de CRM, SCM y ERP se encuentran integrados y funcionando de manera coordinada.',
            checklist: []
        });
    } catch (error) {
        console.error('Error al obtener estado ERP:', error);
        res.status(500).json({ error: 'Error al consultar estado ERP' });
    }
}

/**
 * Actualizar nivel y checklist de adopción ERP
 */
async function updateErpState(req, res) {
    try {
        const { nivel, descripcion, checklist } = req.body;

        const [rows] = await pool.query("SELECT data_value FROM app_data WHERE data_key = 'erp_state'");
        let current = {};
        if (rows.length && rows[0].data_value) {
            current = typeof rows[0].data_value === 'string' ? JSON.parse(rows[0].data_value) : rows[0].data_value;
        }

        const updated = {
            nivel: nivel || current.nivel || 'Integrado',
            descripcion: descripcion || current.descripcion || 'Los módulos de CRM, SCM y ERP se encuentran integrados y funcionando de manera coordinada.',
            checklist: Array.isArray(checklist) ? checklist : (current.checklist || [])
        };

        await pool.query(
            "INSERT INTO app_data (data_key, data_value) VALUES ('erp_state', ?) ON DUPLICATE KEY UPDATE data_value = ?",
            [JSON.stringify(updated), JSON.stringify(updated)]
        );

        res.json({ message: 'Nivel y estado de ERP actualizados correctamente', estado: updated });
    } catch (error) {
        console.error('Error al actualizar estado ERP:', error);
        res.status(500).json({ error: 'Error al guardar estado ERP' });
    }
}

/**
 * Roles empresariales definidos en el sistema
 */
// ─────────────────────────────────────────────────────────────
// INVENTARIO INTEGRAL ERP (UNIFICANDO CRM Y SCM / CMM)
// ─────────────────────────────────────────────────────────────

/**
 * Consulta el inventario consolidado desde el módulo ERP.
 * Cruza en la misma base de datos MySQL:
 * - Datos de Almacén y Catálogo (`productos`)
 * - Datos de SCM (`proveedores`, `movimientos_inventario`, `pedidos_scm`)
 * - Datos de CRM (`clientes`, `ordenes_erp`, `orden_items_erp`)
 */
async function getErpInventory(req, res) {
    try {
        const connection = await pool.getConnection();
        let transactionStarted = false;
        try {
            await connection.beginTransaction();
            transactionStarted = true;
            await ensureLowStockOrders(connection);
            await connection.commit();
            transactionStarted = false;
        } catch (error) {
            if (transactionStarted) await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        const query = `
            SELECT 
                p.id,
                p.name,
                p.category,
                p.price,
                p.unit_cost,
                p.stock,
                p.min_stock,
                p.strategy,
                p.provider_id,
                p.image,
                p.active,
                prov.name AS provider_name,
                prov.contact AS provider_contact,
                prov.email AS provider_email,
                prov.phone AS provider_phone,
                -- SCM: Pedidos pendientes y en camino
                COALESCE(ps_agg.pedidos_pendientes, 0) AS scm_pedidos_pendientes,
                COALESCE(ps_agg.unidades_en_camino, 0) AS scm_unidades_en_camino,
                -- SCM: Último movimiento de almacén
                mov_last.type AS scm_ultimo_movimiento_tipo,
                mov_last.date AS scm_ultimo_movimiento_fecha,
                mov_last.quantity AS scm_ultimo_movimiento_cantidad,
                mov_last.reason AS scm_ultimo_movimiento_motivo,
                -- CRM: Demanda de clientes en órdenes ERP
                COALESCE(crm_agg.unidades_vendidas, 0) AS crm_unidades_vendidas,
                COALESCE(crm_agg.total_facturado, 0) AS crm_total_facturado,
                COALESCE(crm_agg.clientes_distintos, 0) AS crm_clientes_distintos,
                crm_last.client_name AS crm_ultimo_cliente,
                crm_last.fecha AS crm_ultima_orden_fecha
            FROM productos p
            LEFT JOIN proveedores prov ON prov.id = p.provider_id
            LEFT JOIN (
                SELECT product_id,
                       COUNT(*) AS pedidos_pendientes,
                       SUM(quantity) AS unidades_en_camino
                FROM pedidos_scm
                WHERE status IN ('Pendiente', 'En proceso')
                GROUP BY product_id
            ) ps_agg ON ps_agg.product_id = p.id
            LEFT JOIN (
                SELECT m1.product_id, m1.type, m1.date, m1.quantity, m1.reason
                FROM movimientos_inventario m1
                INNER JOIN (
                    SELECT product_id, MAX(id) AS max_id
                    FROM movimientos_inventario
                    GROUP BY product_id
                ) m2 ON m1.id = m2.max_id
            ) mov_last ON mov_last.product_id = p.id
            LEFT JOIN (
                SELECT oi.product_id,
                       SUM(oi.quantity) AS unidades_vendidas,
                       SUM(oi.subtotal) AS total_facturado,
                       COUNT(DISTINCT o.cliente_id) AS clientes_distintos
                FROM orden_items_erp oi
                INNER JOIN ordenes_erp o ON o.id = oi.orden_id
                WHERE o.estado != 'Cancelada'
                GROUP BY oi.product_id
            ) crm_agg ON crm_agg.product_id = p.id
            LEFT JOIN (
                SELECT oi.product_id, o.client_name, o.fecha
                FROM orden_items_erp oi
                INNER JOIN ordenes_erp o ON o.id = oi.orden_id
                INNER JOIN (
                    SELECT oi2.product_id, MAX(o2.id) AS max_order_id
                    FROM orden_items_erp oi2
                    INNER JOIN ordenes_erp o2 ON o2.id = oi2.orden_id
                    WHERE o2.estado != 'Cancelada'
                    GROUP BY oi2.product_id
                ) last_order ON last_order.product_id = oi.product_id AND last_order.max_order_id = o.id
                GROUP BY oi.product_id, o.client_name, o.fecha
            ) crm_last ON crm_last.product_id = p.id
            WHERE p.active = 1
            ORDER BY p.name ASC
        `;

        const [items] = await pool.query(query);

        // Proveedores únicos para los filtros
        const [proveedores] = await pool.query(
            'SELECT id, name FROM proveedores WHERE activo = 1 ORDER BY name ASC'
        );

        let totalStock = 0;
        let valorTotalCosto = 0;
        let valorTotalVenta = 0;
        let articulosStockBajo = 0;
        let unidadesEnCamino = 0;
        let unidadesVendidasCrm = 0;

        const processed = items.map(p => {
            const stock = Number(p.stock) || 0;
            const minStock = p.min_stock != null ? Number(p.min_stock) : null;
            const unitCost = Number(p.unit_cost) || 0;
            const price = Number(p.price) || 0;

            totalStock += stock;
            valorTotalCosto += (stock * unitCost);
            valorTotalVenta += (stock * price);

            let stockStatus = 'Normal';
            if (stock <= 0) {
                stockStatus = 'Agotado';
                articulosStockBajo++;
            } else if (minStock != null && stock <= minStock) {
                stockStatus = 'Bajo';
                articulosStockBajo++;
            }

            unidadesEnCamino += Number(p.scm_unidades_en_camino) || 0;
            unidadesVendidasCrm += Number(p.crm_unidades_vendidas) || 0;

            const marginPct = price > 0 ? (((price - unitCost) / price) * 100).toFixed(1) : '0.0';

            return {
                id: p.id,
                name: p.name,
                category: p.category,
                image: p.image,
                stock,
                min_stock: minStock,
                unit_cost: unitCost,
                price,
                strategy: p.strategy || 'PUSH',
                provider_id: p.provider_id,
                provider_name: p.provider_name || 'Sin proveedor asignado',
                provider_contact: p.provider_contact || '',
                provider_phone: p.provider_phone || '',
                provider_email: p.provider_email || '',
                stock_status: stockStatus,
                valor_costo: Number((stock * unitCost).toFixed(2)),
                valor_venta: Number((stock * price).toFixed(2)),
                margin_percent: Number(marginPct),
                scm: {
                    pedidos_pendientes: Number(p.scm_pedidos_pendientes) || 0,
                    unidades_en_camino: Number(p.scm_unidades_en_camino) || 0,
                    ultimo_movimiento: p.scm_ultimo_movimiento_fecha ? {
                        tipo: p.scm_ultimo_movimiento_tipo,
                        fecha: p.scm_ultimo_movimiento_fecha,
                        cantidad: p.scm_ultimo_movimiento_cantidad,
                        motivo: p.scm_ultimo_movimiento_motivo
                    } : null
                },
                crm: {
                    unidades_vendidas: Number(p.crm_unidades_vendidas) || 0,
                    total_facturado: Number(Number(p.crm_total_facturado || 0).toFixed(2)),
                    clientes_distintos: Number(p.crm_clientes_distintos) || 0,
                    ultimo_cliente: p.crm_ultimo_cliente || 'Sin órdenes aún',
                    ultima_orden_fecha: p.crm_ultima_orden_fecha || null
                }
            };
        });

        res.json({
            items: processed,
            kpis: {
                totalArticulos: items.length,
                totalStock,
                valorTotalCosto: Number(valorTotalCosto.toFixed(2)),
                valorTotalVenta: Number(valorTotalVenta.toFixed(2)),
                articulosStockBajo,
                unidadesEnCamino,
                unidadesVendidasCrm
            },
            proveedores
        });
    } catch (error) {
        console.error('Error en getErpInventory:', error);
        res.status(500).json({ error: 'Error al obtener inventario ERP: ' + error.message });
    }
}

/**
 * Detalle 360° de trazabilidad para un producto del inventario ERP.
 * Muestra el cruce exhaustivo de CRM (órdenes de clientes) y SCM (movimientos y compras).
 */
async function getErpInventoryItemDetail(req, res) {
    try {
        const prodId = Number(req.params.id);
        if (!prodId) return res.status(400).json({ error: 'ID de producto inválido' });

        // 1. Producto y Proveedor
        const [prods] = await pool.query(`
            SELECT p.*, prov.name AS provider_name, prov.contact AS provider_contact,
                   prov.email AS provider_email, prov.phone AS provider_phone, prov.address AS provider_address
            FROM productos p
            LEFT JOIN proveedores prov ON prov.id = p.provider_id
            WHERE p.id = ?
        `, [prodId]);

        if (prods.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        const product = prods[0];

        // 2. Historial de movimientos SCM
        const [movimientos] = await pool.query(`
            SELECT id, date, type, quantity, reason, user, created_at
            FROM movimientos_inventario
            WHERE product_id = ?
            ORDER BY id DESC
            LIMIT 20
        `, [prodId]);

        // 3. Pedidos SCM a proveedor
        const [pedidosScm] = await pool.query(`
            SELECT ps.id, ps.folio, ps.date, ps.quantity, ps.type, ps.status, ps.notes, ps.created_at,
                   prov.name AS provider_name
            FROM pedidos_scm ps
            LEFT JOIN proveedores prov ON prov.id = ps.provider_id
            WHERE ps.product_id = ?
            ORDER BY ps.id DESC
            LIMIT 15
        `, [prodId]);

        // 4. Órdenes CRM de clientes que solicitaron este producto
        const [ordenesCrm] = await pool.query(`
            SELECT o.id, o.folio, o.fecha, o.cliente_id, o.client_name, o.client_company, o.client_email,
                   oi.quantity, oi.unit_price, oi.subtotal, o.estado
            FROM orden_items_erp oi
            INNER JOIN ordenes_erp o ON o.id = oi.orden_id
            WHERE oi.product_id = ?
            ORDER BY o.fecha DESC, o.id DESC
            LIMIT 20
        `, [prodId]);

        // 5. Ranking de clientes CRM que más consumen este producto
        const [topClientes] = await pool.query(`
            SELECT o.cliente_id, o.client_name, o.client_company,
                   COUNT(DISTINCT o.id) AS total_pedidos,
                   SUM(oi.quantity) AS unidades_compradas,
                   SUM(oi.subtotal) AS monto_total
            FROM orden_items_erp oi
            INNER JOIN ordenes_erp o ON o.id = oi.orden_id
            WHERE oi.product_id = ? AND o.estado != 'Cancelada'
            GROUP BY o.cliente_id, o.client_name, o.client_company
            ORDER BY unidades_compradas DESC
            LIMIT 5
        `, [prodId]);

        const stock = Number(product.stock);
        const unitCost = Number(product.unit_cost);
        const price = Number(product.price);

        res.json({
            product: {
                id: product.id,
                name: product.name,
                category: product.category,
                description: product.description,
                image: product.image,
                stock,
                min_stock: product.min_stock != null ? Number(product.min_stock) : null,
                unit_cost: unitCost,
                price,
                strategy: product.strategy,
                valor_costo: Number((stock * unitCost).toFixed(2)),
                valor_venta: Number((stock * price).toFixed(2)),
                margin_percent: price > 0 ? Number((((price - unitCost) / price) * 100).toFixed(1)) : 0,
                provider: {
                    id: product.provider_id,
                    name: product.provider_name || 'Sin proveedor asignado',
                    contact: product.provider_contact,
                    email: product.provider_email,
                    phone: product.provider_phone,
                    address: product.provider_address
                }
            },
            scm: {
                movimientos,
                pedidos: pedidosScm
            },
            crm: {
                ordenes: ordenesCrm,
                topClientes
            }
        });
    } catch (error) {
        console.error('Error en getErpInventoryItemDetail:', error);
        res.status(500).json({ error: 'Error al obtener detalle de inventario: ' + error.message });
    }
}

async function getRoles(req, res) {
    res.json({
        roles: [
            { id: 'admin', nombre: 'Administrador', modulos: ['Dashboard', 'CRM', 'SCM', 'ERP (Órdenes e Inventario)', 'Reportes', 'Usuarios', 'Configuración'] },
            { id: 'ventas', nombre: 'Ventas', modulos: ['Dashboard', 'Clientes (CRM)', 'Productos (SCM)', 'Órdenes (ERP)', 'Inventario (ERP)', 'Reportes', 'Mi actividad'] },
            { id: 'logistica', nombre: 'Logística', modulos: ['Dashboard', 'Productos (SCM)', 'Inventario (SCM)', 'Movimientos', 'Órdenes Proveedores (SCM)', 'Órdenes (ERP)', 'Inventario (ERP)', 'Reportes'] }
        ]
    });
}

module.exports = {
    initErpDatabase,
    getOrders,
    getOrderById,
    createOrder,
    updateOrder,
    updateOrderStatus,
    getMetrics,
    getErpState,
    updateErpState,
    getRoles,
    getErpInventory,
    getErpInventoryItemDetail
};
