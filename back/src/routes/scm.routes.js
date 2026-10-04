const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const scm = require('../controllers/scm.controller');

const router = express.Router();

function requireAdmin(req, res, next) {
    if (['admin', 'super_administrador'].includes(req.user?.role)) return next();
    return res.status(403).json({ error: 'Solo un administrador puede modificar datos SCM' });
}

router.get('/productos', scm.getProducts);
router.get('/productos/:id/movimientos', scm.getProductMovements);
router.post('/productos', verifyToken, requireAdmin, scm.createProduct);
router.put('/productos/:id/estrategia', verifyToken, requireAdmin, scm.updateStrategy);
router.put('/productos/:id', verifyToken, requireAdmin, scm.updateProduct);
router.delete('/productos/:id', verifyToken, requireAdmin, scm.deleteProduct);

router.get('/proveedores', scm.getProviders);
router.post('/proveedores', verifyToken, requireAdmin, scm.createProvider);
router.put('/proveedores/:id', verifyToken, requireAdmin, scm.updateProvider);
router.delete('/proveedores/:id', verifyToken, requireAdmin, scm.deleteProvider);

router.post('/inventario/movimiento', verifyToken, requireAdmin, scm.createMovement);
router.get('/inventario/movimientos', scm.getAllMovements);

router.get('/pedidos', scm.getOrders);
router.post('/pedidos', verifyToken, requireAdmin, scm.createOrder);
router.put('/pedidos/:id/estado', verifyToken, requireAdmin, scm.updateOrderStatus);

router.get('/scm/estado', scm.getScmState);
router.put('/scm/nivel', verifyToken, requireAdmin, scm.updateScmLevel);

module.exports = router;
