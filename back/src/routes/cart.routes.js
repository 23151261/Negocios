const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth.middleware');
const { getCart, saveCart, transferGuestCart, isValidCartSessionId } = require('../controllers/cart.controller');

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

router.use(authenticateIfProvided);
router.use(resolveCartOwner);
router.get('/', getCart);
router.put('/', saveCart);
router.post('/transferir', verifyToken, transferGuestCart);

module.exports = router;
