const pool = require('../config/db');
const { ensureLowStockOrders } = require('./data.controller');
const getProductImage = require('../utils/productImage');

const validStrategies = new Set(['PUSH', 'PULL']);
const validOrderStatuses = new Set(['Pendiente', 'En proceso', 'Surtido', 'Cancelado']);

class RequestError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function parseData(value, fallback) {
    if (value === null || value === undefined) return fallback;
    return typeof value === 'string' ? JSON.parse(value) : value;
}

async function getAppData(connection, key, fallback) {
    const [rows] = await connection.query('SELECT data_value FROM app_data WHERE data_key = ?', [key]);
    return rows.length ? parseData(rows[0].data_value, fallback) : fallback;
}

async function setAppData(connection, key, value) {
    await connection.query(
        'INSERT INTO app_data (data_key, data_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE data_value = VALUES(data_value)',
        [key, JSON.stringify(value)]
    );
}

async function inTransaction(operation) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await operation(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

function run(handler, successStatus = 200) {
    return async (req, res) => {
        try {
            res.status(successStatus).json(await handler(req));
        } catch (error) {
            if (error.status) return res.status(error.status).json({ error: error.message });
            res.status(500).json({ error: 'Error al procesar la operación SCM' });
        }
    };
}

function number(value, field, { integer = false, min = 0 } = {}) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || (integer && !Number.isSafeInteger(parsed)) || parsed < min) {
        throw new RequestError(400, `${field} no es válido`);
    }
    return parsed;
}

function requiredText(value, field) {
    if (typeof value !== 'string' || !value.trim()) {
        throw new RequestError(400, `${field} es obligatorio`);
    }
    return value.trim();
}

function localDate(value, field = 'Fecha') {
    if (value === undefined || value === null || value === '') return new Date().toLocaleDateString('es-MX');
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new RequestError(400, `${field} inválida`);
    }
    const parsed = new Date(`${value}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
        throw new RequestError(400, `${field} inválida`);
    }
    return parsed.toLocaleDateString('es-MX');
}

function normalizeStrategy(value) {
    const strategy = String(value || '').trim().toUpperCase();
    if (!validStrategies.has(strategy)) throw new RequestError(400, 'Estrategia debe ser PUSH o PULL');
    return strategy;
}

function normalizeOrderStatus(value) {
    const normalized = String(value || '').trim().toLowerCase();
    const status = {
        pendiente: 'Pendiente',
        pending: 'Pendiente',
        'en proceso': 'En proceso',
        processing: 'En proceso',
        surtido: 'Surtido',
        supplied: 'Surtido',
        cancelado: 'Cancelado',
        cancelled: 'Cancelado',
        canceled: 'Cancelado'
    }[normalized];
    if (!status || !validOrderStatuses.has(status)) throw new RequestError(400, 'Estado de pedido no válido');
    return status;
}

async function getProduct(connection, id) {
    const productId = number(id, 'ID de producto', { integer: true, min: 1 });
    const [[product]] = await connection.query('SELECT * FROM productos WHERE id=? AND active=1', [productId]);
    if (!product) throw new RequestError(404, 'Producto no encontrado');
    return { productId, product };
}

async function resolveProvider(connection, providerId) {
    if (!providerId) return;
    const [[prov]] = await connection.query('SELECT id FROM proveedores WHERE id=? AND activo=1', [providerId]);
    if (!prov) throw new RequestError(400, 'Proveedor no encontrado');
}

function productPayload(body, current = {}, currentMeta = {}) {
    const name = body.name === undefined ? current.name : requiredText(body.name, 'Nombre');
    const category = body.category === undefined ? current.category : requiredText(body.category, 'Categoría');
    if (!name || !category) throw new RequestError(400, 'Nombre y categoría son obligatorios');
    const price = number(body.price === undefined ? current.price : body.price, 'Precio');
    const stock = number(body.stock === undefined ? current.stock : body.stock, 'Existencia', { integer: true });
    const minStockRaw = body.minStock === undefined
        ? (current.min_stock != null ? current.min_stock : currentMeta.minStock)
        : body.minStock;
    const minStock = number(minStockRaw, 'Stock mínimo', { integer: true, min: 1 });
    const unitCostRaw = body.unitCost === undefined
        ? (current.unit_cost != null ? current.unit_cost : (currentMeta.unitCost ?? 0))
        : body.unitCost;
    const unitCost = number(unitCostRaw, 'Costo unitario');
    const strategyRaw = body.strategy === undefined
        ? (current.strategy || currentMeta.strategy || 'PUSH')
        : body.strategy;
    const strategy = normalizeStrategy(strategyRaw);
    const providerIdRaw = body.providerId === undefined
        ? (current.provider_id != null ? current.provider_id : currentMeta.providerId)
        : body.providerId;
    const providerId = providerIdRaw ? number(providerIdRaw, 'ID de proveedor', { integer: true, min: 1 }) : null;
    const description = body.description === undefined ? (body.desc ?? current.description ?? '') : body.description;
    const image = body.image === undefined ? (current.image ?? '') : body.image;
    if (typeof description !== 'string' || typeof image !== 'string') {
        throw new RequestError(400, 'Descripción e imagen deben ser texto');
    }
    return {
        name,
        category,
        price,
        stock,
        minStock,
        unitCost,
        strategy,
        providerId,
        description,
        image
    };
}

async function applyStrategyChange(connection, productId, currentStrategy, nextStrategy) {
    if (currentStrategy === nextStrategy) return;

    if (nextStrategy === 'PULL') {
        await connection.query(
            "UPDATE pedidos_scm SET status='Cancelado', retry_suppressed=1, notes=CONCAT(COALESCE(notes,''),' Cancelado: estrategia PULL requiere pedido manual.') WHERE product_id=? AND auto_generated=1 AND status IN ('Pendiente','En proceso')",
            [productId]
        );
        return;
    }

    await connection.query(
        'UPDATE pedidos_scm SET retry_suppressed=0 WHERE product_id=? AND auto_generated=1 AND retry_suppressed=1',
        [productId]
    );
}

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────

async function getProducts(req) {
    const strategyFilter = req.query.estrategia === undefined
        ? null
        : normalizeStrategy(req.query.estrategia);
    const [products] = await pool.query(`
        SELECT p.*, pv.name AS provider_name
        FROM productos p
        LEFT JOIN proveedores pv ON pv.id = p.provider_id AND pv.activo = 1
        WHERE p.active=1
        ORDER BY p.id
    `);
    return products
        .map(p => ({
            id: Number(p.id),
            name: p.name,
            description: p.description,
            desc: p.description,
            category: p.category,
            price: Number(p.price),
            stock: Number(p.stock),
            status: p.status,
            image: getProductImage(p.image, p.name),
            minStock: p.min_stock != null ? Number(p.min_stock) : null,
            strategy: p.strategy || 'PUSH',
            providerId: p.provider_id != null ? Number(p.provider_id) : null,
            unitCost: Number(p.unit_cost || 0),
            providerName: p.provider_name || null
        }))
        .filter(p => !strategyFilter || p.strategy === strategyFilter);
}

async function createProduct(req) {
    return inTransaction(async connection => {
        if (!req.file) throw new RequestError(400, 'Selecciona una imagen para el producto');
        req.body.image = `/uploads/productos/${req.file.filename}`;
        const input = productPayload(req.body);
        await resolveProvider(connection, input.providerId);
        const [result] = await connection.query(
            'INSERT INTO productos (name, category, price, description, image, badge, badge_text, stock, status, min_stock, strategy, unit_cost, provider_id, active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1)',
            [input.name, input.category, input.price, input.description, input.image, null, null, input.stock,
             input.stock > 0 ? 'disponible' : 'agotado', input.minStock, input.strategy, input.unitCost, input.providerId]
        );
        await ensureLowStockOrders(connection);
        return { id: result.insertId, ...input };
    });
}

async function updateProduct(req) {
    return inTransaction(async connection => {
        const { productId, product } = await getProduct(connection, req.params.id);
        if (req.file) req.body.image = `/uploads/productos/${req.file.filename}`;
        const input = productPayload(req.body, product);
        await resolveProvider(connection, input.providerId);
        await applyStrategyChange(
            connection,
            productId,
            String(product.strategy || 'PUSH').toUpperCase(),
            input.strategy
        );
        await connection.query(
            'UPDATE productos SET name=?, category=?, price=?, description=?, image=?, stock=?, status=?, min_stock=?, strategy=?, unit_cost=?, provider_id=? WHERE id=? AND active=1',
            [input.name, input.category, input.price, input.description, input.image, input.stock,
             input.stock > 0 ? 'disponible' : 'agotado', input.minStock, input.strategy, input.unitCost,
             input.providerId, productId]
        );
        await ensureLowStockOrders(connection);
        return { id: productId, ...input };
    });
}

async function deleteProduct(req) {
    return inTransaction(async connection => {
        const { productId, product } = await getProduct(connection, req.params.id);
        const [cancelled] = await connection.query(
            "UPDATE pedidos_scm SET status='Cancelado', product_name=?, notes=CONCAT(COALESCE(notes,''),' Cancelado: producto eliminado.') WHERE product_id=? AND status IN ('Pendiente','En proceso')",
            [product.name, productId]
        );
        await connection.query(
            'UPDATE productos SET active=0, provider_id=NULL WHERE id=? AND active=1',
            [productId]
        );
        return { message: 'Producto eliminado', cancelledOrders: cancelled.affectedRows };
    });
}

async function updateStrategy(req) {
    return inTransaction(async connection => {
        const { productId } = await getProduct(connection, req.params.id);
        const strategy = normalizeStrategy(req.body.estrategia ?? req.body.strategy);
        const [[current]] = await connection.query('SELECT strategy FROM productos WHERE id=?', [productId]);
        await applyStrategyChange(
            connection,
            productId,
            String(current.strategy || 'PUSH').toUpperCase(),
            strategy
        );
        await connection.query('UPDATE productos SET strategy=? WHERE id=?', [strategy, productId]);
        await ensureLowStockOrders(connection);
        return { productId, estrategia: strategy };
    });
}

async function uploadProductImage(req) {
    const productId = number(req.params.id, 'ID de producto', { integer: true, min: 1 });
    const [[product]] = await pool.query('SELECT id FROM productos WHERE id=? AND active=1', [productId]);
    if (!product) throw new RequestError(404, 'Producto no encontrado');
    if (!req.file) throw new RequestError(400, 'No se recibió ningún archivo de imagen');
    const imagePath = `/uploads/productos/${req.file.filename}`;
    await pool.query('UPDATE productos SET image=? WHERE id=? AND active=1', [imagePath, productId]);
    return { id: productId, image: imagePath };
}

// ─── PROVEEDORES ──────────────────────────────────────────────────────────────

async function getProviders() {
    const [rows] = await pool.query('SELECT * FROM proveedores WHERE activo=1 ORDER BY id');
    return rows;
}

async function createProvider(req) {
    return inTransaction(async connection => {
        const { name, contact, email, phone } = req.body;
        if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            throw new RequestError(400, 'Correo electrónico de proveedor inválido');
        }
        const normalizedEmail = email.trim().toLowerCase();
        const [[existing]] = await connection.query(
            'SELECT id FROM proveedores WHERE LOWER(email)=? AND activo=1',
            [normalizedEmail]
        );
        if (existing) throw new RequestError(409, 'El correo ya está registrado para otro proveedor');
        const address = typeof req.body.address === 'string' ? req.body.address.trim() : '';
        const products = typeof req.body.products === 'string' ? req.body.products.trim() : '';
        const [result] = await connection.query(
            'INSERT INTO proveedores (name, contact, email, phone, address, products, activo) VALUES (?,?,?,?,?,?,1)',
            [requiredText(name, 'Nombre'), requiredText(contact, 'Contacto'), normalizedEmail,
             requiredText(phone, 'Teléfono'), address, products]
        );
        const [[provider]] = await connection.query('SELECT * FROM proveedores WHERE id=?', [result.insertId]);
        return provider;
    });
}

async function updateProvider(req) {
    return inTransaction(async connection => {
        const providerId = number(req.params.id, 'ID de proveedor', { integer: true, min: 1 });
        const [[current]] = await connection.query('SELECT * FROM proveedores WHERE id=? AND activo=1', [providerId]);
        if (!current) throw new RequestError(404, 'Proveedor no encontrado');
        const emailRaw = req.body.email === undefined ? current.email : String(req.body.email).trim().toLowerCase();
        if (typeof emailRaw !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
            throw new RequestError(400, 'Correo electrónico de proveedor inválido');
        }
        const [[dup]] = await connection.query(
            'SELECT id FROM proveedores WHERE LOWER(email)=? AND id<>? AND activo=1',
            [emailRaw, providerId]
        );
        if (dup) throw new RequestError(409, 'El correo ya está registrado para otro proveedor');
        const updated = {
            name: req.body.name === undefined ? current.name : requiredText(req.body.name, 'Nombre'),
            contact: req.body.contact === undefined ? current.contact : requiredText(req.body.contact, 'Contacto'),
            email: emailRaw,
            phone: req.body.phone === undefined ? current.phone : requiredText(req.body.phone, 'Teléfono'),
            address: req.body.address === undefined ? current.address : String(req.body.address).trim(),
            products: req.body.products === undefined ? current.products : String(req.body.products).trim()
        };
        await connection.query(
            'UPDATE proveedores SET name=?, contact=?, email=?, phone=?, address=?, products=? WHERE id=?',
            [updated.name, updated.contact, updated.email, updated.phone, updated.address, updated.products, providerId]
        );
        const [[provider]] = await connection.query('SELECT * FROM proveedores WHERE id=?', [providerId]);
        return provider;
    });
}

async function deleteProvider(req) {
    return inTransaction(async connection => {
        const providerId = number(req.params.id, 'ID de proveedor', { integer: true, min: 1 });
        const [[provider]] = await connection.query('SELECT id FROM proveedores WHERE id=? AND activo=1', [providerId]);
        if (!provider) throw new RequestError(404, 'Proveedor no encontrado');
        // Verificar productos asignados
        const [[{ count }]] = await connection.query(
            'SELECT COUNT(*) AS count FROM productos WHERE provider_id=?',
            [providerId]
        );
        if (Number(count) > 0) {
            throw new RequestError(409, `No se puede eliminar: el proveedor tiene ${count} producto${count === 1 ? '' : 's'} asociado${count === 1 ? '' : 's'}`);
        }
        // Verificar pedidos pendientes
        const [[{ pendientes }]] = await connection.query(
            "SELECT COUNT(*) AS pendientes FROM pedidos_scm WHERE provider_id=? AND status IN ('Pendiente','En proceso')",
            [providerId]
        );
        if (Number(pendientes) > 0) {
            throw new RequestError(409, 'No se puede eliminar un proveedor con pedidos pendientes');
        }
        await connection.query('DELETE FROM proveedores WHERE id=?', [providerId]);
        return { message: 'Proveedor eliminado' };
    });
}

// ─── MOVIMIENTOS ──────────────────────────────────────────────────────────────

async function createMovement(req) {
    return inTransaction(async connection => {
        const productId = number(req.body.productId ?? req.body.producto_id, 'ID de producto', { integer: true, min: 1 });
        const typeInput = String(req.body.type ?? req.body.tipo ?? '').trim().toLowerCase();
        const type = typeInput === 'entrada' ? 'Entrada' : typeInput === 'salida' ? 'Salida' : null;
        if (!type) throw new RequestError(400, 'Tipo de movimiento debe ser entrada o salida');
        const quantity = number(req.body.quantity ?? req.body.cantidad, 'Cantidad', { integer: true, min: 1 });
        const reason = requiredText(req.body.reason ?? req.body.motivo, 'Motivo');
        const date = localDate(req.body.date, 'Fecha de movimiento');
        const { product } = await getProduct(connection, productId);
        const stockChange = type === 'Entrada' ? quantity : -quantity;
        const [update] = await connection.query(
            `UPDATE productos SET status=IF(stock+?>0,'disponible','agotado'), stock=stock+? WHERE id=? AND stock+?>=0`,
            [stockChange, stockChange, productId, stockChange]
        );
        if (!update.affectedRows) throw new RequestError(409, 'Stock insuficiente para registrar la salida');
        const userName = req.user?.name || req.user?.email || 'Usuario';
        await connection.query(
            'INSERT INTO movimientos_inventario (date, product_id, product_name, type, quantity, reason, user) VALUES (?,?,?,?,?,?,?)',
            [date, productId, product.name, type, Math.abs(stockChange), reason, userName]
        );
        const [[updated]] = await connection.query('SELECT stock FROM productos WHERE id=?', [productId]);
        await ensureLowStockOrders(connection);
        return { date, productId, type, quantity: Math.abs(stockChange), reason, user: userName, stockAnterior: Number(product.stock), stockActual: Number(updated.stock) };
    });
}

async function getProductMovements(req) {
    const productId = number(req.params.id, 'ID de producto', { integer: true, min: 1 });
    const [[prod]] = await pool.query('SELECT id FROM productos WHERE id=?', [productId]);
    if (!prod) throw new RequestError(404, 'Producto no encontrado');
    const [rows] = await pool.query(
        'SELECT * FROM movimientos_inventario WHERE product_id=? ORDER BY id DESC',
        [productId]
    );
    return rows;
}

async function getAllMovements() {
    const [rows] = await pool.query(`
        SELECT m.*, COALESCE(m.product_name, p.name) AS product_name
        FROM movimientos_inventario m
        LEFT JOIN productos p ON p.id = m.product_id
        ORDER BY m.id DESC
    `);
    return rows;
}

// ─── PEDIDOS ──────────────────────────────────────────────────────────────────

async function getOrders() {
    return inTransaction(async connection => {
        await ensureLowStockOrders(connection);
        const [orders] = await connection.query(`
            SELECT ps.*, p.name AS product_name_live
            FROM pedidos_scm ps
            LEFT JOIN productos p ON p.id = ps.product_id
            ORDER BY ps.id DESC
        `);
        return orders.map(o => ({
            id: Number(o.id),
            folio: o.folio,
            date: o.date,
            productId: Number(o.product_id),
            quantity: Number(o.quantity),
            type: o.type,
            status: o.status,
            providerId: o.provider_id ? Number(o.provider_id) : null,
            notes: o.notes || '',
            autoGenerated: Boolean(o.auto_generated),
            stockReceived: Boolean(o.stock_received),
            productName: o.product_name_live || o.product_name || `Producto #${o.product_id}`
        }));
    });
}

async function createOrder(req) {
    return inTransaction(async connection => {
        const productId = number(req.body.productId ?? req.body.producto_id, 'ID de producto', { integer: true, min: 1 });
        const quantity = number(req.body.quantity ?? req.body.cantidad, 'Cantidad', { integer: true, min: 1 });
        const { product } = await getProduct(connection, productId);
        const typeRaw = String(req.body.type ?? req.body.tipo ?? 'Reposición').trim().toLowerCase();
        const type = ['venta','sale'].includes(typeRaw) ? 'Venta'
            : ['reposicion','reposición','replenishment','suministro','supply'].includes(typeRaw) ? 'Reposición' : null;
        if (!type) throw new RequestError(400, 'Tipo de pedido debe ser reposición o venta');
        const providerId = product.provider_id ? Number(product.provider_id) : null;
        if (type === 'Reposición') {
            if (!providerId) {
                throw new RequestError(409, 'Asigna un proveedor al producto antes de generar un pedido de reposición');
            }
            await resolveProvider(connection, providerId);
        }
        const [[{ maxId }]] = await connection.query('SELECT COALESCE(MAX(id),0) AS maxId FROM pedidos_scm');
        const orderId = Math.max(Date.now(), Number(maxId) + 1);
        const [[{ maxFolio }]] = await connection.query("SELECT COALESCE(MAX(CAST(SUBSTRING(folio,4) AS UNSIGNED)),0) AS maxFolio FROM pedidos_scm WHERE folio REGEXP '^PC-[0-9]+$'");
        const folio = `PC-${String(Number(maxFolio) + 1).padStart(3, '0')}`;
        const orderDate = localDate(req.body.date, 'Fecha del pedido');
        if (type === 'Venta') {
            const [update] = await connection.query(
                "UPDATE productos SET status=IF(stock-?>0,'disponible','agotado'), stock=stock-? WHERE id=? AND stock>=?",
                [quantity, quantity, productId, quantity]
            );
            if (!update.affectedRows) throw new RequestError(409, 'Stock insuficiente para registrar la venta');
            const userName = req.user?.name || req.user?.email || 'Usuario';
            await connection.query(
                'INSERT INTO movimientos_inventario (date, product_id, product_name, type, quantity, reason, user) VALUES (?,?,?,?,?,?,?)',
                [orderDate, productId, product.name, 'Salida', quantity, `Venta ${folio}`, userName]
            );
        }
        await connection.query(
            'INSERT INTO pedidos_scm (id, folio, date, product_id, quantity, type, status, provider_id, notes, auto_generated, product_name) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [orderId, folio, orderDate, productId, quantity, type, 'Pendiente', providerId ? Number(providerId) : null,
             typeof req.body.notes === 'string' ? req.body.notes.trim() : '', 0, product.name]
        );
        if (type === 'Venta') await ensureLowStockOrders(connection);
        return { id: orderId, folio, date: orderDate, productId, quantity, type, status: 'Pendiente', providerId: providerId ? Number(providerId) : null, autoGenerated: false };
    });
}

async function updateOrderStatus(req) {
    return inTransaction(async connection => {
        const orderId = String(req.params.id);
        const status = normalizeOrderStatus(req.body.status ?? req.body.estado);
        const [[order]] = await connection.query(
            'SELECT * FROM pedidos_scm WHERE id=? OR folio=?',
            [orderId, orderId]
        );
        if (!order) throw new RequestError(404, 'Pedido no encontrado');
        if (order.status === 'Cancelado') {
            throw new RequestError(409, 'El pedido ya fue cancelado y su estado quedó bloqueado');
        }
        const previouslyReceived = Boolean(order.stock_received) || order.status === 'Surtido';
        if (status === 'Cancelado' && order.auto_generated && !previouslyReceived) {
            const [[prod]] = await connection.query('SELECT stock, min_stock FROM productos WHERE id=?', [order.product_id]);
            const retrySuppressed = prod && prod.min_stock != null && Number(prod.stock) <= Number(prod.min_stock);
            await connection.query(
                "UPDATE pedidos_scm SET status='Cancelado', retry_suppressed=? WHERE id=?",
                [retrySuppressed ? 1 : 0, order.id]
            );
        } else if (status === 'Surtido' && !previouslyReceived && ['Reposición','Suministro'].includes(order.type)) {
            await connection.query(
                "UPDATE productos SET stock=stock+?, status='disponible' WHERE id=?",
                [Number(order.quantity), Number(order.product_id)]
            );
            const userName = req.user?.name || req.user?.email || 'Usuario';
            const [[product]] = await connection.query(
                'SELECT name FROM productos WHERE id=?',
                [Number(order.product_id)]
            );
            await connection.query(
                'INSERT INTO movimientos_inventario (date, product_id, product_name, type, quantity, reason, user) VALUES (?,?,?,?,?,?,?)',
                [new Date().toLocaleDateString('es-MX'), Number(order.product_id), product?.name || order.product_name || `Producto #${order.product_id}`, 'Entrada', Number(order.quantity), `Pedido surtido (${order.folio})`, userName]
            );
            await connection.query(
                'UPDATE pedidos_scm SET status=?, stock_received=1 WHERE id=?',
                [status, order.id]
            );
        } else {
            await connection.query('UPDATE pedidos_scm SET status=? WHERE id=?', [status, order.id]);
        }
        await ensureLowStockOrders(connection);
        const [[updated]] = await connection.query('SELECT * FROM pedidos_scm WHERE id=?', [order.id]);
        return {
            id: Number(updated.id), folio: updated.folio, date: updated.date,
            productId: Number(updated.product_id), quantity: Number(updated.quantity),
            type: updated.type, status: updated.status,
            providerId: updated.provider_id ? Number(updated.provider_id) : null,
            notes: updated.notes || '', autoGenerated: Boolean(updated.auto_generated),
            stockReceived: Boolean(updated.stock_received)
        };
    });
}

// ─── SCM LEVEL / STATE ────────────────────────────────────────────────────────

async function getScmState() {
    const [state, maturity] = await Promise.all([
        getAppData(pool, 'scm_level', 'Inicial'),
        getAppData(pool, 'scm_maturity', [])
    ]);
    return { nivel_scm: state, checklist: maturity };
}

async function updateScmLevel(req) {
    const levels = new Set(['Inicial', 'En desarrollo', 'Optimizado']);
    const level = String(req.body.nivel_scm ?? req.body.level ?? '').trim();
    if (!levels.has(level)) throw new RequestError(400, 'Nivel SCM debe ser Inicial, En desarrollo u Optimizado');
    await setAppData(pool, 'scm_level', level);
    return { nivel_scm: level };
}

module.exports = {
    getProducts: run(getProducts),
    createProduct: run(createProduct, 201),
    updateProduct: run(updateProduct),
    deleteProduct: run(deleteProduct),
    updateStrategy: run(updateStrategy),
    uploadProductImage: run(uploadProductImage),
    getProviders: run(getProviders),
    createProvider: run(createProvider, 201),
    updateProvider: run(updateProvider),
    deleteProvider: run(deleteProvider),
    createMovement: run(createMovement, 201),
    getAllMovements: run(getAllMovements),
    getProductMovements: run(getProductMovements),
    getOrders: run(getOrders),
    createOrder: run(createOrder, 201),
    updateOrderStatus: run(updateOrderStatus),
    getScmState: run(getScmState),
    updateScmLevel: run(updateScmLevel)
};
