const pool = require('../config/db');
const MAX_CART_QUANTITY = 2147483647;

function getCartRows(executor, sessionKey) {
    return executor.query(
        `SELECT c.id AS cart_item_id, c.product_id, c.publication_id, c.quantity, c.marketplace,
                COALESCE(p.name, pub.nombre) AS name,
                COALESCE(p.price, pub.precio) AS price,
                pub.foto
         FROM carrito c
         LEFT JOIN productos p ON p.id = c.product_id
         LEFT JOIN publicaciones pub ON pub.id = c.publication_id
         WHERE c.session_key = ?
         ORDER BY c.id`,
        [sessionKey]
    ).then(([rows]) => rows.map(row => ({
        id: row.cart_item_id,
        productId: row.marketplace ? row.publication_id : row.product_id,
        quantity: Number(row.quantity),
        nombre: row.name,
        name: row.name,
        precio: Number(row.price),
        price: Number(row.price),
        subtotal: Number((Number(row.price) * Number(row.quantity)).toFixed(2)),
        foto: row.foto || '',
        esMarketplace: Boolean(row.marketplace)
    })));
}

function isValidCartSessionId(value) {
    return typeof value === 'string'
        && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
}

function isValidItem(item) {
    return item && typeof item === 'object'
        && Number.isSafeInteger(Number(item.productId))
        && Number(item.productId) > 0
        && Number.isSafeInteger(Number(item.quantity))
        && Number(item.quantity) > 0
        && Number(item.quantity) <= MAX_CART_QUANTITY
        && (item.esMarketplace === undefined || typeof item.esMarketplace === 'boolean');
}

async function validateItems(connection, items) {
    if (!Array.isArray(items) || items.length > 100 || items.some(item => !isValidItem(item))) {
        return 'El carrito debe contener hasta 100 productos con cantidades enteras positivas';
    }

    const seenItems = new Set();
    for (const item of items) {
        const isMarketplace = Boolean(item.esMarketplace);
        const productId = Number(item.productId);
        const uniqueItemKey = `${isMarketplace ? 'marketplace' : 'product'}:${productId}`;
        if (seenItems.has(uniqueItemKey)) return 'El carrito contiene productos duplicados';
        seenItems.add(uniqueItemKey);

        const table = isMarketplace ? 'publicaciones' : 'productos';
        const [rows] = await connection.query(`SELECT id FROM ${table} WHERE id = ?`, [productId]);
        if (rows.length === 0) return `El producto ${productId} ya no está disponible`;
    }
    return null;
}

async function getCart(req, res) {
    try {
        res.json(await getCartRows(pool, req.cartSessionKey));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'No se pudo cargar el carrito' });
    }
}

async function saveCart(req, res) {
    const connection = await pool.getConnection();
    let transactionStarted = false;
    try {
        await connection.beginTransaction();
        transactionStarted = true;
        const validationError = await validateItems(connection, req.body);
        if (validationError) {
            await connection.rollback();
            transactionStarted = false;
            return res.status(400).json({ error: validationError });
        }

        await connection.query('DELETE FROM carrito WHERE session_key = ?', [req.cartSessionKey]);
        for (const item of req.body) {
            const isMarketplace = Boolean(item.esMarketplace);
            await connection.query(
                `INSERT INTO carrito (session_key, product_id, publication_id, quantity, marketplace)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    req.cartSessionKey,
                    isMarketplace ? null : Number(item.productId),
                    isMarketplace ? Number(item.productId) : null,
                    Number(item.quantity),
                    isMarketplace ? 1 : 0
                ]
            );
        }
        const savedCart = await getCartRows(connection, req.cartSessionKey);
        await connection.commit();
        transactionStarted = false;
        res.json({ key: 'cart', data: savedCart });
    } catch (error) {
        if (transactionStarted) await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'No se pudo guardar el carrito' });
    } finally {
        connection.release();
    }
}

async function transferGuestCart(req, res) {
    if (req.user?.role !== 'usuario') {
        return res.status(403).json({ error: 'Inicia sesión como cliente para transferir el carrito' });
    }
    const guestSessionId = req.get('X-Cart-Session');
    if (!isValidCartSessionId(guestSessionId)) {
        return res.status(400).json({ error: 'La sesión del carrito de invitado no es válida' });
    }

    const guestKey = `guest:${guestSessionId}`;
    const customerKey = `client:${req.user.id}`;
    if (guestKey === customerKey) return res.status(400).json({ error: 'La sesión del carrito no es válida' });

    const connection = await pool.getConnection();
    let transactionStarted = false;
    try {
        await connection.beginTransaction();
        transactionStarted = true;
        const [customer] = await connection.query(
            'SELECT id FROM clientes WHERE id = ? FOR UPDATE',
            [Number(req.user.id)]
        );
        if (customer.length === 0) {
            await connection.rollback();
            transactionStarted = false;
            return res.status(403).json({ error: 'La cuenta no está asociada a un cliente' });
        }

        const [guestItems] = await connection.query(
            'SELECT product_id, publication_id, quantity, marketplace FROM carrito WHERE session_key = ? ORDER BY id FOR UPDATE',
            [guestKey]
        );
        const [customerItems] = await connection.query(
            'SELECT product_id, publication_id, quantity, marketplace FROM carrito WHERE session_key = ? ORDER BY id FOR UPDATE',
            [customerKey]
        );
        const mergedItems = new Map();
        for (const item of [...customerItems, ...guestItems]) {
            const isMarketplace = Boolean(item.marketplace);
            const productId = Number(isMarketplace ? item.publication_id : item.product_id);
            const key = `${isMarketplace ? 'marketplace' : 'product'}:${productId}`;
            const existing = mergedItems.get(key);
            mergedItems.set(key, {
                productId,
                quantity: Math.min(MAX_CART_QUANTITY, Number(item.quantity) + (existing?.quantity || 0)),
                esMarketplace: isMarketplace
            });
        }

        const validationError = await validateItems(connection, Array.from(mergedItems.values()));
        if (validationError) {
            await connection.rollback();
            transactionStarted = false;
            return res.status(409).json({ error: validationError });
        }

        await connection.query('DELETE FROM carrito WHERE session_key IN (?, ?)', [guestKey, customerKey]);
        for (const item of mergedItems.values()) {
            const isMarketplace = item.esMarketplace;
            await connection.query(
                `INSERT INTO carrito (session_key, product_id, publication_id, quantity, marketplace)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    customerKey,
                    isMarketplace ? null : item.productId,
                    isMarketplace ? item.productId : null,
                    item.quantity,
                    isMarketplace ? 1 : 0
                ]
            );
        }

        const savedCart = await getCartRows(connection, customerKey);
        await connection.commit();
        transactionStarted = false;
        res.json({ key: 'cart', data: savedCart });
    } catch (error) {
        if (transactionStarted) await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'No se pudo transferir el carrito a la cuenta' });
    } finally {
        connection.release();
    }
}

// ─── Endpoints específicos de Etapa 4 ───────────────────────
async function agregarAlCarrito(req, res) {
    try {
        const { producto_id, cantidad } = req.body || {};
        const pId = Number(producto_id);
        const qty = Number(cantidad === undefined ? 1 : cantidad);

        if (!Number.isSafeInteger(pId) || pId <= 0 || !Number.isSafeInteger(qty) || qty <= 0 || qty > 1000) {
            return res.status(400).json({ error: 'Producto no válido' });
        }
        const targetKey = req.cartSessionKey;
        const [products] = await pool.query(
            "SELECT id, stock, status, active FROM productos WHERE id = ?",
            [pId]
        );
        if (products.length === 0 || Number(products[0].active) !== 1 || products[0].status !== 'disponible') {
            return res.status(404).json({ error: 'Producto no disponible' });
        }

        const [existing] = await pool.query(
            'SELECT id, quantity FROM carrito WHERE session_key = ? AND product_id = ?',
            [targetKey, pId]
        );

        if (existing.length > 0) {
            const newQty = Number(existing[0].quantity) + qty;
            if (newQty > Number(products[0].stock)) {
                return res.status(409).json({ error: 'La cantidad solicitada supera el stock disponible' });
            }
            await pool.query('UPDATE carrito SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
        } else {
            if (qty > Number(products[0].stock)) {
                return res.status(409).json({ error: 'La cantidad solicitada supera el stock disponible' });
            }
            await pool.query(
                'INSERT INTO carrito (session_key, product_id, quantity, marketplace) VALUES (?, ?, ?, 0)',
                [targetKey, pId, qty]
            );
        }

        const items = await getCartRows(pool, targetKey);
        res.json({ success: true, items });
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        res.status(500).json({ error: 'Error al agregar producto al carrito' });
    }
}

async function getCarritoCliente(req, res) {
    try {
        const items = await getCartRows(pool, req.cartSessionKey);
        res.json(items);
    } catch (error) {
        console.error('Error al obtener carrito de cliente:', error);
        res.status(500).json({ error: 'Error al obtener carrito' });
    }
}

async function updateCartItem(req, res) {
    try {
        const itemId = Number(req.params.id);
        const { cantidad } = req.body;
        const qty = Number(cantidad);

        if (!Number.isSafeInteger(qty) || qty < 1 || qty > 1000) {
            return res.status(400).json({ error: 'Cantidad inválida' });
        }

        const [result] = await pool.query(
            'UPDATE carrito SET quantity = ? WHERE id = ? AND session_key = ?',
            [qty, itemId, `client:${Number(req.user.id)}`]
        );
        if (!result.affectedRows) return res.status(404).json({ error: 'Producto del carrito no encontrado' });
        res.json({ success: true, id: itemId, cantidad: qty });
    } catch (error) {
        console.error('Error al actualizar item del carrito:', error);
        res.status(500).json({ error: 'Error al actualizar producto en el carrito' });
    }
}

async function removeCartItem(req, res) {
    try {
        const itemId = Number(req.params.id);
        const [result] = await pool.query(
            'DELETE FROM carrito WHERE id = ? AND session_key = ?',
            [itemId, `client:${Number(req.user.id)}`]
        );
        if (!result.affectedRows) return res.status(404).json({ error: 'Producto del carrito no encontrado' });
        res.json({ success: true, message: 'Producto eliminado del carrito' });
    } catch (error) {
        console.error('Error al eliminar item del carrito:', error);
        res.status(500).json({ error: 'Error al eliminar producto del carrito' });
    }
}

async function vaciarCarritoCliente(req, res) {
    try {
        await pool.query('DELETE FROM carrito WHERE session_key = ?', [req.cartSessionKey]);
        res.json({ success: true, message: 'Carrito vaciado' });
    } catch (error) {
        console.error('Error al vaciar carrito:', error);
        res.status(500).json({ error: 'Error al vaciar carrito' });
    }
}

module.exports = {
    getCart,
    saveCart,
    transferGuestCart,
    isValidCartSessionId,
    agregarAlCarrito,
    getCarritoCliente,
    updateCartItem,
    removeCartItem,
    vaciarCarritoCliente
};
