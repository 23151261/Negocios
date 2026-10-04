const pool = require('../config/db');
const { ensureLowStockOrders } = require('./data.controller');

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
            console.error('[SCM API]', error);
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

function defaultProviderId(category) {
    if (category === 'Pizzas') return 2;
    if (category === 'Pescados') return 3;
    if (category === 'Bebidas') return 5;
    if (category === 'Ensaladas') return 4;
    return 1;
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
    const [[product]] = await connection.query('SELECT * FROM productos WHERE id = ?', [productId]);
    if (!product) throw new RequestError(404, 'Producto no encontrado');
    const metadata = await getAppData(connection, 'scm_product_meta', {});
    return {
        productId,
        product,
        meta: metadata[productId] || {}
    };
}

async function resolveProvider(connection, providerId) {
    if (!providerId) return;
    const providers = await getAppData(connection, 'scm_providers', []);
    if (!providers.some(provider => Number(provider.id) === Number(providerId))) {
        throw new RequestError(400, 'Proveedor no encontrado');
    }
}

function productPayload(body, current = {}, currentMeta = {}) {
    const name = body.name === undefined ? current.name : requiredText(body.name, 'Nombre');
    const category = body.category === undefined ? current.category : requiredText(body.category, 'Categoría');
    if (!name || !category) throw new RequestError(400, 'Nombre y categoría son obligatorios');
    const price = number(body.price === undefined ? current.price : body.price, 'Precio');
    const stock = number(body.stock === undefined ? current.stock : body.stock, 'Existencia', { integer: true });
    const minStock = number(body.minStock === undefined ? currentMeta.minStock : body.minStock, 'Stock mínimo', { integer: true, min: 1 });
    const unitCost = number(body.unitCost === undefined ? (currentMeta.unitCost ?? 0) : body.unitCost, 'Costo unitario');
    const strategy = normalizeStrategy(body.strategy === undefined ? (currentMeta.strategy || 'PUSH') : body.strategy);
    const providerId = body.providerId === undefined ? currentMeta.providerId : body.providerId;
    const normalizedProviderId = providerId ? number(providerId, 'ID de proveedor', { integer: true, min: 1 }) : defaultProviderId(category);
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
        providerId: normalizedProviderId,
        description,
        image
    };
}

function registerActivity(req, productId, type, quantity, reason, date) {
    return {
        id: Date.now(),
        date: date ? new Date(`${date}T00:00:00`).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX'),
        productId,
        type,
        quantity,
        reason,
        user: req.user?.name || req.user?.email || 'Usuario'
    };
}

async function getProducts(req) {
    const strategyFilter = req.query.estrategia === undefined
        ? null
        : normalizeStrategy(req.query.estrategia);
    const [products] = await pool.query('SELECT * FROM productos ORDER BY id');
    const metadata = await getAppData(pool, 'scm_product_meta', {});
    return products
        .map(product => ({
            id: Number(product.id),
            name: product.name,
            description: product.description,
            desc: product.description,
            category: product.category,
            price: Number(product.price),
            stock: Number(product.stock),
            status: product.status,
            image: product.image,
            minStock: metadata[product.id]?.minStock == null ? null : Number(metadata[product.id].minStock),
            strategy: metadata[product.id]?.strategy || 'PUSH',
            providerId: metadata[product.id]?.providerId ?? defaultProviderId(product.category),
            unitCost: Number(metadata[product.id]?.unitCost ?? 0)
        }))
        .filter(product => !strategyFilter || product.strategy === strategyFilter);
}

async function createProduct(req) {
    return inTransaction(async connection => {
        const input = productPayload(req.body);
        await resolveProvider(connection, input.providerId);
        const [result] = await connection.query(
            'INSERT INTO productos (name, category, price, description, image, badge, badge_text, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [input.name, input.category, input.price, input.description, input.image, null, null, input.stock, input.stock > 0 ? 'disponible' : 'agotado']
        );
        const productMeta = await getAppData(connection, 'scm_product_meta', {});
        productMeta[result.insertId] = {
            minStock: input.minStock,
            strategy: input.strategy,
            unitCost: input.unitCost,
            providerId: input.providerId
        };
        await setAppData(connection, 'scm_product_meta', productMeta);
        await ensureLowStockOrders(connection);
        return { id: result.insertId, ...input };
    });
}

async function updateProduct(req) {
    return inTransaction(async connection => {
        const { productId, product, meta } = await getProduct(connection, req.params.id);
        const input = productPayload(req.body, product, meta);
        await resolveProvider(connection, input.providerId);
        await connection.query(
            'UPDATE productos SET name = ?, category = ?, price = ?, description = ?, image = ?, stock = ?, status = ? WHERE id = ?',
            [input.name, input.category, input.price, input.description, input.image, input.stock, input.stock > 0 ? 'disponible' : 'agotado', productId]
        );
        const productMeta = await getAppData(connection, 'scm_product_meta', {});
        productMeta[productId] = {
            minStock: input.minStock,
            strategy: input.strategy,
            unitCost: input.unitCost,
            providerId: input.providerId
        };
        await setAppData(connection, 'scm_product_meta', productMeta);
        await ensureLowStockOrders(connection);
        return { id: productId, ...input };
    });
}

async function deleteProduct(req) {
    return inTransaction(async connection => {
        const { productId } = await getProduct(connection, req.params.id);
        const orders = await getAppData(connection, 'scm_orders', []);
        const hasOpenOrder = orders.some(order =>
            Number(order.productId) === productId
            && ['pendiente', 'en proceso'].includes(String(order.status || '').toLowerCase())
        );
        if (hasOpenOrder) throw new RequestError(409, 'No se puede eliminar un producto con pedidos pendientes');
        await connection.query('DELETE FROM productos WHERE id = ?', [productId]);
        const metadata = await getAppData(connection, 'scm_product_meta', {});
        delete metadata[productId];
        await setAppData(connection, 'scm_product_meta', metadata);
        return { message: 'Producto eliminado' };
    });
}

async function updateStrategy(req) {
    return inTransaction(async connection => {
        const { productId } = await getProduct(connection, req.params.id);
        const strategy = normalizeStrategy(req.body.estrategia ?? req.body.strategy);
        const metadata = await getAppData(connection, 'scm_product_meta', {});
        metadata[productId] = { ...(metadata[productId] || {}), strategy };
        await setAppData(connection, 'scm_product_meta', metadata);
        await ensureLowStockOrders(connection);
        return { productId, estrategia: strategy };
    });
}

async function getProviders() {
    return getAppData(pool, 'scm_providers', []);
}

async function createProvider(req) {
    return inTransaction(async connection => {
        const { name, contact, email, phone } = req.body;
        const providers = await getAppData(connection, 'scm_providers', []);
        if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            throw new RequestError(400, 'Correo electrónico de proveedor inválido');
        }
        if (providers.some(provider => String(provider.email).toLowerCase() === email.trim().toLowerCase())) {
            throw new RequestError(409, 'El correo ya está registrado para otro proveedor');
        }
        const provider = {
            id: providers.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1,
            name: requiredText(name, 'Nombre'),
            contact: requiredText(contact, 'Contacto'),
            email: email.trim().toLowerCase(),
            phone: requiredText(phone, 'Teléfono'),
            address: typeof req.body.address === 'string' ? req.body.address.trim() : '',
            products: typeof req.body.products === 'string' ? req.body.products.trim() : ''
        };
        providers.push(provider);
        await setAppData(connection, 'scm_providers', providers);
        return provider;
    });
}

async function updateProvider(req) {
    return inTransaction(async connection => {
        const providers = await getAppData(connection, 'scm_providers', []);
        const providerId = number(req.params.id, 'ID de proveedor', { integer: true, min: 1 });
        const index = providers.findIndex(provider => Number(provider.id) === providerId);
        if (index === -1) throw new RequestError(404, 'Proveedor no encontrado');
        const current = providers[index];
        const email = req.body.email === undefined ? current.email : String(req.body.email).trim().toLowerCase();
        if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new RequestError(400, 'Correo electrónico de proveedor inválido');
        }
        if (providers.some(provider => Number(provider.id) !== providerId && String(provider.email).toLowerCase() === email)) {
            throw new RequestError(409, 'El correo ya está registrado para otro proveedor');
        }
        providers[index] = {
            ...current,
            name: req.body.name === undefined ? current.name : requiredText(req.body.name, 'Nombre'),
            contact: req.body.contact === undefined ? current.contact : requiredText(req.body.contact, 'Contacto'),
            email,
            phone: req.body.phone === undefined ? current.phone : requiredText(req.body.phone, 'Teléfono'),
            address: req.body.address === undefined ? current.address : String(req.body.address).trim(),
            products: req.body.products === undefined ? current.products : String(req.body.products).trim()
        };
        await setAppData(connection, 'scm_providers', providers);
        return providers[index];
    });
}

async function deleteProvider(req) {
    return inTransaction(async connection => {
        const providerId = number(req.params.id, 'ID de proveedor', { integer: true, min: 1 });
        const providers = await getAppData(connection, 'scm_providers', []);
        if (!providers.some(provider => Number(provider.id) === providerId)) {
            throw new RequestError(404, 'Proveedor no encontrado');
        }
        const productMeta = await getAppData(connection, 'scm_product_meta', {});
        if (Object.values(productMeta).some(meta => Number(meta.providerId) === providerId)) {
            throw new RequestError(409, 'No se puede eliminar un proveedor asignado a productos');
        }
        const orders = await getAppData(connection, 'scm_orders', []);
        if (orders.some(order => Number(order.providerId) === providerId
            && ['pendiente', 'en proceso'].includes(String(order.status || '').toLowerCase()))) {
            throw new RequestError(409, 'No se puede eliminar un proveedor con pedidos pendientes');
        }
        await setAppData(connection, 'scm_providers', providers.filter(provider => Number(provider.id) !== providerId));
        return { message: 'Proveedor eliminado' };
    });
}

async function createMovement(req) {
    return inTransaction(async connection => {
        const productId = number(req.body.productId ?? req.body.producto_id, 'ID de producto', { integer: true, min: 1 });
        const typeInput = String(req.body.type ?? req.body.tipo ?? '').trim().toLowerCase();
        const type = typeInput === 'entrada' ? 'Entrada' : typeInput === 'salida' ? 'Salida' : null;
        if (!type) throw new RequestError(400, 'Tipo de movimiento debe ser entrada o salida');
        const quantity = number(req.body.quantity ?? req.body.cantidad, 'Cantidad', { integer: true, min: 1 });
        const reason = requiredText(req.body.reason ?? req.body.motivo, 'Motivo');
        const date = req.body.date;
        localDate(date, 'Fecha de movimiento');
        const { product } = await getProduct(connection, productId);
        const stockChange = type === 'Entrada' ? quantity : -quantity;
        const [update] = await connection.query(
            `UPDATE productos SET status = IF(stock + ? > 0, 'disponible', 'agotado'), stock = stock + ? WHERE id = ? AND stock + ? >= 0`,
            [stockChange, stockChange, productId, stockChange]
        );
        if (!update.affectedRows) throw new RequestError(409, 'Stock insuficiente para registrar la salida');
        const movements = await getAppData(connection, 'scm_movements', []);
        const movement = registerActivity(req, productId, type, stockChange, reason, date);
        if (movements.some(item => Number(item.id) === movement.id)) movement.id += 1;
        movements.unshift(movement);
        await setAppData(connection, 'scm_movements', movements);
        const [[updatedProduct]] = await connection.query('SELECT stock FROM productos WHERE id = ?', [productId]);
        await ensureLowStockOrders(connection);
        return { ...movement, stockAnterior: Number(product.stock), stockActual: Number(updatedProduct.stock) };
    });
}

async function getProductMovements(req) {
    const productId = number(req.params.id, 'ID de producto', { integer: true, min: 1 });
    const [rows] = await pool.query('SELECT id FROM productos WHERE id = ?', [productId]);
    if (rows.length === 0) throw new RequestError(404, 'Producto no encontrado');
    const movements = await getAppData(pool, 'scm_movements', []);
    return movements.filter(item => Number(item.productId) === productId);
}

async function getAllMovements() {
    return getAppData(pool, 'scm_movements', []);
}

function nextOrderId(orders) {
    return Math.max(Date.now(), ...orders.map(order => Number(order.id) || 0)) + 1;
}

function nextOrderFolio(orders) {
    const max = orders.reduce((highest, order) => {
        const match = String(order.folio || '').match(/^PC-(\d+)$/i);
        return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    return `PC-${String(max + 1).padStart(3, '0')}`;
}

async function getOrders() {
    return inTransaction(async connection => {
        await ensureLowStockOrders(connection);
        return getAppData(connection, 'scm_orders', []);
    });
}

async function createOrder(req) {
    return inTransaction(async connection => {
        const productId = number(req.body.productId ?? req.body.producto_id, 'ID de producto', { integer: true, min: 1 });
        const quantity = number(req.body.quantity ?? req.body.cantidad, 'Cantidad', { integer: true, min: 1 });
        const { product, meta } = await getProduct(connection, productId);
        const typeRaw = String(req.body.type ?? req.body.tipo ?? 'Reposición').trim().toLowerCase();
        const type = ['venta', 'sale'].includes(typeRaw) ? 'Venta' : ['reposicion', 'reposición', 'replenishment', 'suministro', 'supply'].includes(typeRaw) ? 'Reposición' : null;
        if (!type) throw new RequestError(400, 'Tipo de pedido debe ser reposición o venta');
        const providerId = req.body.providerId || req.body.proveedor_id || meta.providerId || null;
        if (type === 'Reposición') await resolveProvider(connection, providerId);
        const orders = await getAppData(connection, 'scm_orders', []);
        const orderDate = localDate(req.body.date, 'Fecha del pedido');
        const order = {
            id: nextOrderId(orders),
            folio: nextOrderFolio(orders),
            date: orderDate,
            productId,
            quantity,
            type,
            status: 'Pendiente',
            providerId: providerId ? Number(providerId) : null,
            notes: typeof req.body.notes === 'string' ? req.body.notes.trim() : '',
            autoGenerated: false
        };
        if (type === 'Venta') {
            const [update] = await connection.query(
                "UPDATE productos SET status = IF(stock - ? > 0, 'disponible', 'agotado'), stock = stock - ? WHERE id = ? AND stock >= ?",
                [quantity, quantity, productId, quantity]
            );
            if (!update.affectedRows) throw new RequestError(409, 'Stock insuficiente para registrar la venta');
            const movements = await getAppData(connection, 'scm_movements', []);
            movements.unshift(registerActivity(req, productId, 'Salida', -quantity, `Venta ${order.folio}`));
            await setAppData(connection, 'scm_movements', movements);
        }
        orders.unshift(order);
        await setAppData(connection, 'scm_orders', orders);
        if (type === 'Venta') await ensureLowStockOrders(connection);
        return order;
    });
}

async function updateOrderStatus(req) {
    return inTransaction(async connection => {
        const orderId = String(req.params.id);
        const status = normalizeOrderStatus(req.body.status ?? req.body.estado);
        const orders = await getAppData(connection, 'scm_orders', []);
        const order = orders.find(item => String(item.id) === orderId || String(item.folio) === orderId);
        if (!order) throw new RequestError(404, 'Pedido no encontrado');
        const previouslyReceived = Boolean(order.stockReceived) || order.status === 'Surtido';
        if (status === 'Cancelado' && order.autoGenerated && !previouslyReceived) {
            const { product, meta } = await getProduct(connection, order.productId);
            const minStock = Number(meta.minStock);
            order.retrySuppressedUntilStockRecovers = meta.minStock != null
                && Number.isSafeInteger(minStock)
                && Number(product.stock) <= minStock;
        }
        if (status === 'Surtido' && !previouslyReceived && ['Reposición', 'Suministro'].includes(order.type)) {
            const quantity = number(order.quantity, 'Cantidad del pedido', { integer: true, min: 1 });
            const { productId } = await getProduct(connection, order.productId);
            await connection.query(
                "UPDATE productos SET stock = stock + ?, status = 'disponible' WHERE id = ?",
                [quantity, productId]
            );
            const movements = await getAppData(connection, 'scm_movements', []);
            movements.unshift(registerActivity(req, productId, 'Entrada', quantity, `Pedido surtido (${order.folio})`));
            await setAppData(connection, 'scm_movements', movements);
            order.stockReceived = true;
        }
        order.status = status;
        orders.splice(orders.indexOf(order), 1);
        orders.unshift(order);
        await setAppData(connection, 'scm_orders', orders);
        await ensureLowStockOrders(connection);
        return order;
    });
}

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
