const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const getProductImage = require('../utils/productImage');

const allowedKeys = new Set([
    'products', 'promociones', 'comments', 'clients', 'orders', 'historial',
    'publications', 'auction', 'contactMessages', 'invoices',
    'scm_metrics', 'scm_alerts', 'scm_product_meta', 'scm_providers', 'scm_movements', 'scm_orders', 'scm_logistics', 'scm_maturity',
    'system_config'
]);
const scmWriteKeys = new Set(['scm_providers', 'scm_movements', 'scm_orders', 'scm_logistics', 'scm_maturity']);
const arrayDataKeys = new Set([
    'products', 'promociones', 'comments', 'publications', 'contactMessages',
    'invoices', 'orders', 'historial', 'scm_providers',
    'scm_movements', 'scm_orders', 'scm_logistics', 'scm_maturity'
]);
const saveQueues = new Map();

function isAllowed(key) {
    return allowedKeys.has(key);
}

function toDate(value) {
    if (!value) return new Date();
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? new Date() : value;
    }
    if (typeof value === 'string') {
        const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
            const d = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
            if (!isNaN(d.getTime())) return d;
        }
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toInteractionType(value) {
    const normalized = String(value || 'nota').trim().toLowerCase();
    const aliases = {
        registro: 'nota',
        llamada: 'llamada',
        correo: 'correo',
        reunion: 'reunion',
        'reunión': 'reunion',
        nota: 'nota',
        compra: 'compra',
        pedido: 'compra',
        seguimiento: 'nota'
    };
    return aliases[normalized] || 'nota';
}

function parseAddress(value) {
    if (!value || typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch (_) {
        return value;
    }
}

function parseJsonValue(value, fallback) {
    if (typeof value === 'string') return JSON.parse(value);
    return value || fallback;
}

function getDefaultProviderId(category) {
    if (category === 'Pizzas') return 2;
    if (category === 'Pescados') return 3;
    if (category === 'Bebidas') return 5;
    if (category === 'Ensaladas') return 4;
    return 1;
}

async function ensureLowStockOrders(connection) {
    // Leer productos con sus metadatos SCM directamente de la BD
    const [products] = await connection.query(
        'SELECT id, name, category, stock, min_stock, strategy, provider_id FROM productos WHERE active=1 ORDER BY id FOR UPDATE'
    );

    // Obtener pedidos activos de la tabla relacional
    const [activeOrders] = await connection.query(
        "SELECT * FROM pedidos_scm WHERE status IN ('Pendiente','En proceso') ORDER BY id DESC FOR UPDATE"
    );

    // No repetir una reposición terminada/cancelada hasta que el stock se recupere.
    const [suppressedOrders] = await connection.query(
        "SELECT id, product_id FROM pedidos_scm WHERE auto_generated=1 AND retry_suppressed=1 FOR UPDATE"
    );
    for (const order of suppressedOrders) {
        const prod = products.find(p => Number(p.id) === Number(order.product_id));
        if (prod && prod.min_stock != null && Number(prod.stock) >= Number(prod.min_stock)) {
            await connection.query(
                'UPDATE pedidos_scm SET retry_suppressed=0 WHERE id=?',
                [order.id]
            );
        }
    }

    // Cancelar pedidos auto-generados que ya no cumplen las condiciones
    for (const order of activeOrders) {
        if (!order.auto_generated) continue;
        const product = products.find(item => Number(item.id) === Number(order.product_id));
        if (!product || String(product.strategy || 'PUSH').toUpperCase() !== 'PUSH') {
            await connection.query(
                "UPDATE pedidos_scm SET status='Cancelado', retry_suppressed=1, notes=CONCAT(COALESCE(notes,''),' Cancelado: estrategia PULL requiere pedido manual.') WHERE id=?",
                [order.id]
            );
            continue;
        }
        await connection.query(
            "UPDATE pedidos_scm SET status='Surtido', retry_suppressed=1, notes=? WHERE id=?",
            [`Reposición automática completada sin modificar inventario (${Number(order.quantity)} unidades).`, order.id]
        );
    }

    // Re-leer pedidos activos después de los cambios
    const [currentActiveOrders] = await connection.query(
        "SELECT * FROM pedidos_scm WHERE status IN ('Pendiente','En proceso') FOR UPDATE"
    );
    const [currentSuppressedOrders] = await connection.query(
        'SELECT product_id FROM pedidos_scm WHERE auto_generated=1 AND retry_suppressed=1 FOR UPDATE'
    );

    // Calcular próximo ID y folio
    const [[{ maxId }]] = await connection.query('SELECT COALESCE(MAX(id),0) AS maxId FROM pedidos_scm');
    let nextId = Math.max(Date.now(), Number(maxId) + 1);
    const [[{ maxFolioNum }]] = await connection.query(
        "SELECT COALESCE(MAX(CAST(SUBSTRING(folio,4) AS UNSIGNED)),0) AS maxFolioNum FROM pedidos_scm WHERE folio REGEXP '^PC-[0-9]+$'"
    );
    let nextFolio = Number(maxFolioNum) + 1;

    const createdOrders = [];

    for (const product of products) {
        const strategy = String(product.strategy || 'PUSH').toUpperCase();
        const minStock = product.min_stock != null ? Number(product.min_stock) : null;

        // Solo crear pedidos para PUSH con min_stock configurado y stock bajo
        if (strategy !== 'PUSH' || minStock == null || !Number.isSafeInteger(minStock) || minStock < 1) continue;
        if (Number(product.stock) >= minStock) continue;

        // Verificar si hay retry_suppressed activo
        const hasSuppressed = currentSuppressedOrders.some(
            o => Number(o.product_id) === Number(product.id)
        );
        if (hasSuppressed) continue;

        // Verificar si ya hay un pedido activo de reposición para este producto
        const hasActiveOrder = currentActiveOrders.some(
            o => Number(o.product_id) === Number(product.id) && ['Reposición', 'Suministro'].includes(o.type)
        );
        if (hasActiveOrder) continue;

        // Verificar que el proveedor existe
        const providerId = product.provider_id ? Number(product.provider_id) : null;
        if (!providerId) continue;
        const [[provExists]] = await connection.query(
            'SELECT id FROM proveedores WHERE id=? AND activo=1',
            [providerId]
        );
        if (!provExists) continue;

        const orderId = nextId++;
        const folio = `PC-${String(nextFolio++).padStart(3, '0')}`;
        const date = new Date().toLocaleDateString('es-MX');

        await connection.query(
            'INSERT INTO pedidos_scm (id, folio, date, product_id, quantity, type, status, provider_id, notes, auto_generated, retry_suppressed, product_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
            [orderId, folio, date, Number(product.id), minStock, 'Reposición', 'Surtido', providerId,
             `Reposición automática completada sin modificar inventario (${minStock} unidades).`, 1, 1, product.name]
        );
        createdOrders.push({ id: orderId, folio, productId: Number(product.id), quantity: minStock });
    }

    return createdOrders;
}


async function getRows(key) {
    if (key === 'products') {
        const [rows] = await pool.query('SELECT * FROM productos WHERE active=1 ORDER BY id');
        return rows.map(row => ({ id: row.id, name: row.name, category: row.category, price: Number(row.price), desc: row.description, image: getProductImage(row.image, row.name), badge: row.badge, badgeText: row.badge_text, stock: row.stock, status: row.status }));
    }
    if (key === 'promociones') {
        const [rows] = await pool.query('SELECT * FROM promociones ORDER BY id');
        return rows.map(row => ({ id: row.id, nombre: row.nombre, descuento: row.descuento, productos: row.productos, vigencia: row.vigencia, estado: row.estado }));
    }
    if (key === 'comments') {
        const [rows] = await pool.query('SELECT * FROM comentarios ORDER BY date DESC');
        return rows.map(row => ({ id: row.id, name: row.name, text: row.text, date: row.date, edited: Boolean(row.edited) }));
    }
    if (key === 'publications') {
        const [rows] = await pool.query('SELECT * FROM publicaciones ORDER BY id DESC');
        return rows.map(row => ({ id: row.id, nombre: row.nombre, precio: Number(row.precio), categoria: row.categoria, descripcion: row.descripcion, foto: row.foto, fecha: row.fecha, usuario: '', compras: row.compras }));
    }
    if (key === 'clients') {
        const [clients] = await pool.query('SELECT * FROM clientes ORDER BY id DESC');
        const [interactions] = await pool.query('SELECT * FROM interacciones ORDER BY date DESC');
        return clients.map(({ password, ...client }) => ({ ...client, registeredDate: client.registered_date, lastInteractionDate: client.last_interaction_date, interactions: interactions.filter(item => item.cliente_id === client.id) }));
    }
    if (key === 'orders' || key === 'historial') {
        const source = key === 'orders' ? 'admin' : 'history';
        const [orders] = await pool.query('SELECT * FROM pedidos WHERE source = ? ORDER BY order_date DESC', [source]);
        const [items] = await pool.query('SELECT * FROM pedido_items');
        return orders.map(order => ({ id: order.id, client: order.client_name, products: items.filter(item => item.pedido_id === order.id).map(item => item.name + ' (' + item.quantity + ')').join(', '), total: Number(order.total), status: order.status, date: order.order_date, metodo: order.payment_method, estado: order.status, direccion: parseAddress(order.address), items: items.filter(item => item.pedido_id === order.id).map(item => ({ name: item.name, quantity: item.quantity, price: Number(item.price), subtotal: Number(item.subtotal) })) }));
    }
    if (key === 'contactMessages') {
        const [rows] = await pool.query('SELECT * FROM mensajes_contacto ORDER BY id DESC');
        return rows.map(row => ({ ...row, date: row.created_at }));
    }
    if (key === 'invoices') {
        const [rows] = await pool.query('SELECT * FROM facturas ORDER BY id DESC');
        return rows.map(row => ({
            id: row.id,
            pedidoId: row.pedido_id,
            folio: row.folio,
            rfc: row.rfc,
            razonSocial: row.razon_social,
            regimen: row.regimen,
            cp: row.cp,
            uso: row.uso_cfdi,
            fecha: row.created_at
        }));
    }
    if (key === 'auction') {
        const [rows] = await pool.query('SELECT * FROM ofertas_subasta ORDER BY offered_at');
        const [auction] = await pool.query('SELECT current_bid FROM subastas ORDER BY id DESC LIMIT 1');
        return { ofertas: rows.map(row => ({ usuario: row.user_name, monto: Number(row.amount), timestamp: row.offered_at })), ofertaActual: auction.length ? Number(auction[0].current_bid) : 6 };
    }
    if (key === 'scm_metrics') {
        const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) AS totalProducts FROM productos WHERE active=1');
        const [[{ totalOrders }]] = await pool.query('SELECT COUNT(*) AS totalOrders FROM pedidos');
        const [topProducts] = await pool.query('SELECT pi.name, SUM(pi.quantity) AS soldQty, SUM(pi.subtotal) AS totalAmount FROM pedido_items pi GROUP BY pi.name ORDER BY soldQty DESC LIMIT 5');
        const [products] = await pool.query('SELECT id, name, category, stock, min_stock AS minStock FROM productos WHERE active=1');
        const inventory = products.map(product => ({
            ...product,
            stock: Number(product.stock),
            minStock: product.minStock != null
                && Number.isSafeInteger(Number(product.minStock))
                && Number(product.minStock) > 0
                ? Number(product.minStock)
                : null
        }));
        const lowStockCount = inventory.filter(product => product.minStock !== null && product.stock < product.minStock).length;
        const criticalInventory = inventory
            .filter(product => product.minStock !== null && product.stock < product.minStock)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 5);
        const [[{ providersCount }]] = await pool.query('SELECT COUNT(*) AS providersCount FROM proveedores WHERE activo=1');
        const [[{ inProcessOrders }]] = await pool.query("SELECT COUNT(*) AS inProcessOrders FROM pedidos_scm WHERE status IN ('Pendiente','En proceso')");

        return {
            totalProducts,
            lowStockCount,
            totalOrders,
            providersCount,
            inProcessOrders,
            topProducts,
            criticalInventory
        };
    }
    if (key === 'scm_alerts') {
        const [products] = await pool.query(`
            SELECT p.id, p.name, p.category, p.stock, p.min_stock, p.strategy,
                   pv.name AS provider_name, ps.folio, ps.quantity AS order_quantity,
                   ps.status AS order_status, ps.auto_generated
            FROM productos p
            LEFT JOIN proveedores pv ON pv.id=p.provider_id AND pv.activo=1
            LEFT JOIN pedidos_scm ps ON ps.product_id=p.id
                AND ps.type IN ('Reposición','Suministro')
                AND ps.status IN ('Pendiente','En proceso')
            WHERE p.active=1 AND p.min_stock IS NOT NULL AND p.stock<p.min_stock
            ORDER BY p.id, ps.id DESC
        `);
        const emitted = new Set();
        return products.flatMap(product => {
            if (emitted.has(Number(product.id))) return [];
            emitted.add(Number(product.id));
            return [{
                productId: Number(product.id),
                productName: product.name,
                stock: Number(product.stock),
                minStock: Number(product.min_stock),
                strategy: String(product.strategy || 'PUSH').toUpperCase(),
                providerName: product.provider_name || 'Sin proveedor asignado',
                order: product.folio ? {
                    folio: product.folio,
                    quantity: Number(product.order_quantity),
                    status: product.order_status,
                    autoGenerated: Boolean(product.auto_generated)
                } : null
            }];
        });
    }
    if (key.startsWith('scm_')) {
        const [rows] = await pool.query('SELECT data_value FROM app_data WHERE data_key = ?', [key]);
        if (rows.length && rows[0].data_value) {
            return typeof rows[0].data_value === 'string' ? JSON.parse(rows[0].data_value) : rows[0].data_value;
        }
        if (key === 'system_config') {
            const [rows] = await pool.query("SELECT data_value FROM app_data WHERE data_key = 'system_config'");
            if (rows.length && rows[0].data_value) {
                return typeof rows[0].data_value === 'string' ? JSON.parse(rows[0].data_value) : rows[0].data_value;
            }
            return {
                businessName: 'DeliciasResto / Artesanía MX',
                currency: 'MXN',
                stockAlert: true
            };
        }
        return [];
    }
    if (key === 'system_config') {
        const [rows] = await pool.query("SELECT data_value FROM app_data WHERE data_key = 'system_config'");
        if (rows.length && rows[0].data_value) {
            return typeof rows[0].data_value === 'string' ? JSON.parse(rows[0].data_value) : rows[0].data_value;
        }
        return {
            businessName: 'DeliciasResto / Artesanía MX',
            currency: 'MXN',
            stockAlert: true
        };
    }
    return [];
}

async function replaceRows(key, data) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        if (key === 'products') {
            if (!Array.isArray(data)) throw new Error('Los productos deben enviarse como una lista');
            const [storedProducts] = await connection.query('SELECT id, name FROM productos WHERE active=1');
            const incomingIds = new Set(data.map(item => Number(item.id)));
            const incomingProductIds = data.map(item => Number(item.id)).filter(Number.isSafeInteger);
            for (const product of storedProducts) {
                if (!incomingIds.has(Number(product.id))) {
                    await connection.query(
                        "UPDATE pedidos_scm SET status='Cancelado', product_name=?, notes=CONCAT(COALESCE(notes,''),' Cancelado: producto eliminado.') WHERE product_id=? AND status IN ('Pendiente','En proceso')",
                        [product.name, product.id]
                    );
                    await connection.query('UPDATE productos SET active=0, provider_id=NULL WHERE id=?', [product.id]);
                }
            }
            for (const item of data) {
                const hasMinStock = Object.prototype.hasOwnProperty.call(item, 'minStock');
                const hasStrategy = Object.prototype.hasOwnProperty.call(item, 'strategy');
                const hasUnitCost = Object.prototype.hasOwnProperty.call(item, 'unitCost');
                const hasProviderId = Object.prototype.hasOwnProperty.call(item, 'providerId');
                const [[stored]] = await connection.query('SELECT id FROM productos WHERE id=?', [item.id]);
                const values = [
                    item.id, item.name, item.category, item.price, item.desc || '', item.image || '',
                    item.badge || null, item.badgeText || null, item.stock || 0, item.status || 'disponible',
                    hasMinStock && item.minStock !== '' ? Number(item.minStock) : null,
                    ['PUSH', 'PULL'].includes(String(item.strategy || '').toUpperCase()) ? String(item.strategy).toUpperCase() : 'PUSH',
                    hasUnitCost ? Number(item.unitCost) : 0,
                    hasProviderId && item.providerId ? Number(item.providerId) : null
                ];
                if (stored) {
                    await connection.query(
                        `UPDATE productos SET name=?, category=?, price=?, description=?, image=?, badge=?, badge_text=?,
                         stock=?, status=?, min_stock=IF(?, ?, min_stock), strategy=IF(?, ?, strategy),
                         unit_cost=IF(?, ?, unit_cost), provider_id=IF(?, ?, provider_id), active=1 WHERE id=?`,
                        [
                            item.name, item.category, item.price, item.desc || '', item.image || '',
                            item.badge || null, item.badgeText || null, item.stock || 0, item.status || 'disponible',
                            hasMinStock ? 1 : 0, values[10], hasStrategy ? 1 : 0, values[11],
                            hasUnitCost ? 1 : 0, values[12], hasProviderId ? 1 : 0, values[13], item.id
                        ]
                    );
                } else {
                    await connection.query(
                        `INSERT INTO productos (id, name, category, price, description, image, badge, badge_text,
                         stock, status, min_stock, strategy, unit_cost, provider_id, active)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                        values
                    );
                }
            }
            if (incomingProductIds.length === 0) {
                await connection.query(
                    "UPDATE productos SET active=0, provider_id=NULL WHERE active=1"
                );
            } else {
                const placeholders = incomingProductIds.map(() => '?').join(',');
                await connection.query(
                    `UPDATE productos SET active=0, provider_id=NULL WHERE active=1 AND id NOT IN (${placeholders})`,
                    incomingProductIds
                );
            }
            await ensureLowStockOrders(connection);
        } else if (key === 'promociones') {
            await connection.query('DELETE FROM promociones');
            for (const item of data) await connection.query('INSERT INTO promociones (id, nombre, descuento, productos, vigencia, estado) VALUES (?, ?, ?, ?, ?, ?)', [item.id, item.nombre, item.descuento, item.productos, item.vigencia, item.estado]);
        } else if (key === 'comments') {
            await connection.query('DELETE FROM comentarios');
            for (const item of data) await connection.query('INSERT INTO comentarios (id, name, text, date, edited) VALUES (?, ?, ?, ?, ?)', [item.id, item.name, item.text, toDate(item.date), item.edited ? 1 : 0]);
        } else if (key === 'publications') {
            await connection.query('DELETE FROM publicaciones');
            for (const item of data) await connection.query('INSERT INTO publicaciones (id, nombre, precio, categoria, descripcion, foto, fecha, compras) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [item.id, item.nombre, item.precio, item.categoria, item.descripcion, item.foto || '', toDate(item.fecha), item.compras || 0]);
        } else if (key === 'clients') {
            const [storedClients] = await connection.query('SELECT email, password, company FROM clientes');
            const storedByEmail = new Map(storedClients.map(client => [String(client.email).toLowerCase(), client]));
            const [storedInteractions] = await connection.query('SELECT id, usuario_id FROM interacciones');
            const interactionById = new Map(storedInteractions.map(interaction => [String(interaction.id), interaction]));
            await connection.query('DELETE FROM interacciones');
            await connection.query('DELETE FROM clientes');
            for (const item of data) {
                const stored = storedByEmail.get(String(item.email || '').toLowerCase()) || {};
                let finalPassword = stored.password || null;
                if (item.password && typeof item.password === 'string' && item.password.trim()) {
                    const trimmed = item.password.trim();
                    if (trimmed.startsWith('$2a$') || trimmed.startsWith('$2b$')) {
                        finalPassword = trimmed;
                    } else {
                        finalPassword = await bcrypt.hash(trimmed, 10);
                    }
                }
                await connection.query('INSERT INTO clientes (id, name, email, password, company, phone, address, stage, status, orders, spent, registered_date, last_interaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [item.id, item.name, item.email, finalPassword, item.company !== undefined ? item.company : (stored.company || ''), item.phone, item.address || '', item.stage || 'prospecto', item.status || 'activo', item.orders || 0, item.spent || 0, toDate(item.registeredDate), item.lastInteractionDate ? toDate(item.lastInteractionDate) : null]);
                for (const interaction of item.interactions || []) {
                    const storedInteraction = interactionById.get(String(interaction.id));
                    const userId = Number(interaction.usuario_id) || storedInteraction?.usuario_id || null;
                    if (Number.isSafeInteger(Number(interaction.id)) && Number(interaction.id) > 0) {
                        await connection.query(
                            'INSERT INTO interacciones (id, cliente_id, type, date, note, user, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [interaction.id, item.id, toInteractionType(interaction.type), toDate(interaction.date), interaction.note || '', interaction.user || 'Administrador', userId]
                        );
                    } else {
                        await connection.query(
                            'INSERT INTO interacciones (cliente_id, type, date, note, user, usuario_id) VALUES (?, ?, ?, ?, ?, ?)',
                            [item.id, toInteractionType(interaction.type), toDate(interaction.date), interaction.note || '', interaction.user || 'Administrador', userId]
                        );
                    }
                }
            }
        } else if (key === 'contactMessages') {
            await connection.query('DELETE FROM mensajes_contacto');
            for (const item of data) await connection.query('INSERT INTO mensajes_contacto (name, email, message, created_at) VALUES (?, ?, ?, ?)', [item.name, item.email, item.message, toDate(item.date)]);
        } else if (key === 'invoices') {
            await connection.query('DELETE FROM facturas');
            for (const item of data) {
                let validPedidoId = null;
                const rawPedidoId = item.pedidoId || item.pedido_id;
                if (rawPedidoId) {
                    const [p] = await connection.query('SELECT id FROM pedidos WHERE id = ?', [String(rawPedidoId)]);
                    if (p.length > 0) validPedidoId = p[0].id;
                }
                await connection.query('INSERT INTO facturas (pedido_id, folio, rfc, razon_social, regimen, cp, uso_cfdi, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [validPedidoId, item.folio || 'SIN-FOLIO', item.rfc || 'RFC NO ESPECIFICADO', item.razonSocial || item.razon_social || 'Sin razón social', item.regimen || 'Régimen General de Ley', item.cp || 'No especificado', item.uso || item.uso_cfdi || 'G01 - Adquisicion de mercancias', toDate(item.fecha || item.created_at)]);
            }
        } else if (key === 'auction') {
            await connection.query('DELETE FROM ofertas_subasta');
            await connection.query('DELETE FROM subastas');
            const [result] = await connection.query('INSERT INTO subastas (title, current_bid) VALUES (?, ?)', ['Subasta marketplace', Number(data.ofertaActual)]);
            for (const item of data.ofertas || []) await connection.query('INSERT INTO ofertas_subasta (subasta_id, user_name, amount, offered_at) VALUES (?, ?, ?, ?)', [result.insertId, item.usuario, item.monto, toDate(item.timestamp)]);
        } else if (key === 'orders' || key === 'historial') {
            const source = key === 'orders' ? 'admin' : 'history';
            const [storedOrders] = await connection.query('SELECT id FROM pedidos WHERE source = ?', [source]);
            const storedOrderIds = new Set(storedOrders.map(order => String(order.id)));
            await connection.query('DELETE FROM pedido_items WHERE pedido_id IN (SELECT id FROM pedidos WHERE source = ?)', [source]);
            await connection.query('DELETE FROM pedidos WHERE source = ?', [source]);
            for (const item of data) {
                const orderId = String(item.id);
                const status = item.status || item.estado || 'pendiente';
                const payment = item.metodo || 'Tarjeta';
                const orderDate = toDate(item.date || item.fecha);
                await connection.query('INSERT INTO pedidos (id, client_name, total, status, payment_method, order_date, source, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [orderId, item.client || item.direccion?.nombre || '', item.total || 0, status, payment, orderDate, source, item.direccion ? JSON.stringify(item.direccion) : null]);
                const orderItems = item.items || [];
                for (const product of orderItems) {
                    const quantity = product.quantity === undefined ? 1 : Number(product.quantity);
                    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
                        throw new Error(`Cantidad inválida en el pedido ${orderId}`);
                    }
                    await connection.query('INSERT INTO pedido_items (pedido_id, name, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)', [orderId, product.name, quantity, product.price || 0, product.subtotal || 0]);
                    if (source === 'admin' && !storedOrderIds.has(orderId) && product.inventoryTracked !== false) {
                        const productId = Number(product.productId);
                        const whereClause = Number.isSafeInteger(productId) && productId > 0 ? 'id = ?' : 'name = ?';
                        const productIdentifier = whereClause === 'id = ?' ? productId : product.name;
                        await connection.query(
                            `UPDATE productos SET status = IF(stock <= ?, 'agotado', status), stock = GREATEST(0, stock - ?) WHERE ${whereClause}`,
                            [quantity, quantity, productIdentifier]
                        );
                    }
                }
                storedOrderIds.add(orderId);
            }
            if (source === 'admin') {
                await ensureLowStockOrders(connection);
            }
        } else if (key.startsWith('scm_') || key === 'system_config') {
            if (key.startsWith('scm_') && !Array.isArray(data)) {
                throw new Error('Los datos SCM deben enviarse como una lista');
            }
            await connection.query(
                'INSERT INTO app_data (data_key, data_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE data_value = VALUES(data_value)',
                [key, JSON.stringify(data)]
            );
        }
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

const getData = async (req, res) => {
    const { key } = req.params;
    if (key === 'cart') {
        return res.status(410).json({ error: 'El carrito ahora usa /api/carrito y se guarda por cliente' });
    }
    if (!isAllowed(key)) return res.status(400).json({ error: 'Colección no permitida' });
    try { res.json(await getRows(key)); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al obtener datos SQL' }); }
};

const saveData = async (req, res) => {
    const { key } = req.params;
    if (key === 'cart') {
        return res.status(410).json({ error: 'El carrito ahora usa /api/carrito y se guarda por cliente' });
    }
    if (!isAllowed(key)) return res.status(400).json({ error: 'Colección no permitida' });
    if (key === 'clients') {
        return res.status(405).json({ error: 'Usa los endpoints REST de /api/clientes para administrar clientes' });
    }
    if (arrayDataKeys.has(key) && !Array.isArray(req.body)) {
        return res.status(400).json({ error: `La colección ${key} debe enviarse como una lista` });
    }
    if (key === 'auction') {
        const auction = req.body;
        if (!auction || typeof auction !== 'object' || Array.isArray(auction)
            || !Array.isArray(auction.ofertas)
            || !Number.isFinite(Number(auction.ofertaActual))
            || auction.ofertas.some(offer => !offer || typeof offer !== 'object'
                || typeof offer.usuario !== 'string'
                || !Number.isFinite(Number(offer.monto)) || Number(offer.monto) <= 0)) {
            return res.status(400).json({ error: 'La subasta debe incluir una oferta actual y una lista de ofertas válidas' });
        }
    }
    if (key === 'system_config' && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) {
        return res.status(400).json({ error: 'La configuración debe enviarse como un objeto' });
    }
    const containsScmMetadata = key === 'products'
        && Array.isArray(req.body)
        && req.body.some(product => product && typeof product === 'object'
            && ['minStock', 'strategy', 'unitCost', 'providerId']
            .some(field => Object.prototype.hasOwnProperty.call(product, field)));
    if (key.startsWith('scm_') && !scmWriteKeys.has(key)) {
        return res.status(400).json({ error: 'Esta colección SCM es de solo lectura' });
    }
    if ((scmWriteKeys.has(key) || containsScmMetadata || key === 'products') && !['admin', 'super_administrador'].includes(req.user?.role)) {
        return res.status(403).json({ error: 'Solo un administrador puede guardar datos SCM' });
    }
    if (key === 'clients' && !['admin', 'super_administrador'].includes(req.user?.role)) {
        return res.status(403).json({ error: 'Solo un administrador puede guardar datos CRM' });
    }
    const previousSave = saveQueues.get(key) || Promise.resolve();
    const currentSave = previousSave.catch(() => {}).then(() => replaceRows(key, req.body));
    saveQueues.set(key, currentSave);
    try { await currentSave; res.json({ key, data: req.body }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al guardar datos SQL' }); } finally {
        if (saveQueues.get(key) === currentSave) saveQueues.delete(key);
    }
};

module.exports = { getData, saveData, ensureLowStockOrders };
