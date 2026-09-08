const pool = require('../config/db');

const allowedKeys = new Set(['products', 'promociones', 'comments', 'clients', 'orders', 'historial', 'publications', 'cart', 'auction', 'contactMessages', 'invoices']);
const saveQueues = new Map();

function isAllowed(key) {
    return allowedKeys.has(key);
}

function toDate(value) {
    return value ? new Date(value) : new Date();
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

async function getRows(key) {
    if (key === 'products') {
        const [rows] = await pool.query('SELECT * FROM productos ORDER BY id');
        return rows.map(row => ({ id: row.id, name: row.name, category: row.category, price: Number(row.price), desc: row.description, image: row.image, badge: row.badge, badgeText: row.badge_text, stock: row.stock, status: row.status }));
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
    if (key === 'cart') {
        const [rows] = await pool.query('SELECT c.*, COALESCE(p.name, pub.nombre) AS name, COALESCE(p.price, pub.precio) AS price, pub.foto FROM carrito c LEFT JOIN productos p ON p.id = c.product_id LEFT JOIN publicaciones pub ON pub.id = c.publication_id WHERE c.session_key = ?', ['global']);
        return rows.map(row => ({ productId: row.marketplace ? row.publication_id : row.product_id, quantity: row.quantity, nombre: row.name, precio: Number(row.price), foto: row.foto || '', esMarketplace: Boolean(row.marketplace) }));
    }
    return [];
}

async function replaceRows(key, data) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        if (key === 'products') {
            await connection.query('DELETE FROM productos');
            for (const item of data) await connection.query('INSERT INTO productos (id, name, category, price, description, image, badge, badge_text, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [item.id, item.name, item.category, item.price, item.desc || '', item.image || '', item.badge, item.badgeText, item.stock || 0, item.status || 'disponible']);
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
            await connection.query('DELETE FROM interacciones');
            await connection.query('DELETE FROM clientes');
            for (const item of data) {
                const stored = storedByEmail.get(String(item.email || '').toLowerCase()) || {};
                await connection.query('INSERT INTO clientes (id, name, email, password, company, phone, address, stage, status, orders, spent, registered_date, last_interaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [item.id, item.name, item.email, stored.password || null, item.company !== undefined ? item.company : (stored.company || ''), item.phone, item.address || '', item.stage || 'prospecto', item.status || 'activo', item.orders || 0, item.spent || 0, toDate(item.registeredDate), item.lastInteractionDate ? toDate(item.lastInteractionDate) : null]);
                for (const interaction of item.interactions || []) await connection.query('INSERT INTO interacciones (cliente_id, type, date, note, user) VALUES (?, ?, ?, ?, ?)', [item.id, toInteractionType(interaction.type), toDate(interaction.date), interaction.note || '', interaction.user || 'Administrador']);
            }
        } else if (key === 'contactMessages') {
            await connection.query('DELETE FROM mensajes_contacto');
            for (const item of data) await connection.query('INSERT INTO mensajes_contacto (name, email, message, created_at) VALUES (?, ?, ?, ?)', [item.name, item.email, item.message, toDate(item.date)]);
        } else if (key === 'invoices') {
            await connection.query('DELETE FROM facturas');
            for (const item of data) await connection.query('INSERT INTO facturas (pedido_id, folio, rfc, razon_social, regimen, cp, uso_cfdi, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [item.pedidoId || item.pedido_id || null, item.folio || 'SIN-FOLIO', item.rfc || 'RFC NO ESPECIFICADO', item.razonSocial || item.razon_social || 'Sin razón social', item.regimen || 'Régimen General de Ley', item.cp || 'No especificado', item.uso || item.uso_cfdi || 'G01 - Adquisicion de mercancias', toDate(item.fecha || item.created_at)]);
        } else if (key === 'auction') {
            await connection.query('DELETE FROM ofertas_subasta');
            await connection.query('DELETE FROM subastas');
            const [result] = await connection.query('INSERT INTO subastas (title, current_bid) VALUES (?, ?)', ['Subasta marketplace', data.ofertaActual || 6]);
            for (const item of data.ofertas || []) await connection.query('INSERT INTO ofertas_subasta (subasta_id, user_name, amount, offered_at) VALUES (?, ?, ?, ?)', [result.insertId, item.usuario, item.monto, toDate(item.timestamp)]);
        } else if (key === 'cart') {
            await connection.query('DELETE FROM carrito WHERE session_key = ?', ['global']);
            for (const item of data) {
                const isMarketplace = Boolean(item.esMarketplace);
                await connection.query(
                    'INSERT INTO carrito (session_key, product_id, publication_id, quantity, marketplace) VALUES (?, ?, ?, ?, ?)',
                    ['global', isMarketplace ? null : item.productId, isMarketplace ? item.productId : null, item.quantity || 1, isMarketplace ? 1 : 0]
                );
            }
        } else if (key === 'orders' || key === 'historial') {
            const source = key === 'orders' ? 'admin' : 'history';
            await connection.query('DELETE FROM pedido_items WHERE pedido_id IN (SELECT id FROM pedidos WHERE source = ?)', [source]);
            await connection.query('DELETE FROM pedidos WHERE source = ?', [source]);
            for (const item of data) {
                const orderId = String(item.id);
                const status = item.status || item.estado || 'pendiente';
                const payment = item.metodo || 'Tarjeta';
                const orderDate = toDate(item.date || item.fecha);
                await connection.query('INSERT INTO pedidos (id, client_name, total, status, payment_method, order_date, source, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [orderId, item.client || item.direccion?.nombre || '', item.total || 0, status, payment, orderDate, source, item.direccion ? JSON.stringify(item.direccion) : null]);
                const orderItems = item.items || [];
                for (const product of orderItems) await connection.query('INSERT INTO pedido_items (pedido_id, name, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)', [orderId, product.name, product.quantity || 1, product.price || 0, product.subtotal || 0]);
            }
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
    if (!isAllowed(key)) return res.status(400).json({ error: 'Colección no permitida' });
    try { res.json(await getRows(key)); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al obtener datos SQL' }); }
};

const saveData = async (req, res) => {
    const { key } = req.params;
    if (!isAllowed(key)) return res.status(400).json({ error: 'Colección no permitida' });
    const previousSave = saveQueues.get(key) || Promise.resolve();
    const currentSave = previousSave.catch(() => {}).then(() => replaceRows(key, req.body));
    saveQueues.set(key, currentSave);
    try { await currentSave; res.json({ key, data: req.body }); } catch (error) { console.error(error); res.status(500).json({ error: 'Error al guardar datos SQL' }); } finally {
        if (saveQueues.get(key) === currentSave) saveQueues.delete(key);
    }
};

module.exports = { getData, saveData };
