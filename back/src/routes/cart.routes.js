const express = require('express');
const pool = require('../config/db');
const { verifyToken, requireRoles } = require('../middleware/auth.middleware');
const {
    getCart,
    saveCart,
    transferGuestCart,
    isValidCartSessionId,
    agregarAlCarrito,
    getCarritoCliente,
    updateCartItem,
    removeCartItem,
    vaciarCarritoCliente
} = require('../controllers/cart.controller');

const router = express.Router();

function authenticateIfProvided(req, res, next) {
    if (!req.headers.authorization) return next();
    return verifyToken(req, res, next);
}

async function resolveCartOwner(req, res, next) {
    if (req.user) {
        if (req.user.role !== 'usuario' || !Number.isSafeInteger(Number(req.user.id)) || Number(req.user.id) <= 0) {
            return res.status(403).json({ error: 'El carrito de cuenta solo está disponible para clientes' });
        }
        try {
            const [customers] = await pool.query('SELECT id FROM clientes WHERE id = ?', [Number(req.user.id)]);
            if (customers.length === 0) return res.status(403).json({ error: 'La cuenta no está asociada a un cliente' });
            req.cartSessionKey = `client:${Number(req.user.id)}`;
            return next();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'No se pudo validar la cuenta del carrito' });
        }
    }

    const guestSessionId = req.get('X-Cart-Session');
    if (!isValidCartSessionId(guestSessionId)) {
        return res.status(400).json({ error: 'La sesión del carrito no es válida' });
    }
    req.cartSessionKey = `guest:${guestSessionId}`;
    return next();
}

function resolveOwnClientCart(req, res, next) {
    const requestedClientId = req.params.cliente_id !== undefined
        ? Number(req.params.cliente_id)
        : req.body?.cliente_id !== undefined
            ? Number(req.body.cliente_id)
            : Number(req.user?.id);
    const clienteId = Number(req.user?.id);
    if (req.user?.role !== 'usuario' || !Number.isSafeInteger(clienteId) || requestedClientId !== clienteId) {
        return res.status(403).json({ error: 'Solo puedes modificar tu propio carrito' });
    }
    req.cartSessionKey = `client:${clienteId}`;
    next();
}

// ─── Rutas explícitas Etapa 4 ───────────────────────────────
router.post('/agregar', verifyToken, requireRoles('usuario'), resolveOwnClientCart, agregarAlCarrito);
router.put('/item/:id', verifyToken, requireRoles('usuario'), updateCartItem);
router.delete('/item/:id', verifyToken, requireRoles('usuario'), removeCartItem);
router.delete('/vaciar/:cliente_id', verifyToken, requireRoles('usuario'), resolveOwnClientCart, vaciarCarritoCliente);
router.get('/:cliente_id', verifyToken, requireRoles('usuario'), resolveOwnClientCart, getCarritoCliente);

// ─── Rutas con middleware de sesión del carrito ─────────────
router.use(authenticateIfProvided);
router.use(resolveCartOwner);
router.get('/', getCart);
router.put('/', saveCart);
router.post('/', verifyToken, transferGuestCart);
router.post('/transferir', verifyToken, transferGuestCart);

module.exports = router;
