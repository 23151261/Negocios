const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { productImageUpload } = require('../middleware/imageUpload.middleware');
const scm = require('../controllers/scm.controller');

const router = express.Router();

function requireAdmin(req, res, next) {
    if (['admin', 'super_administrador'].includes(req.user?.role)) return next();
    return res.status(403).json({ error: 'Solo un administrador puede modificar datos SCM' });
}

function requireStaff(req, res, next) {
    if (['admin', 'super_administrador', 'ventas', 'logistica'].includes(req.user?.role)) return next();
    return res.status(403).json({ error: 'El catálogo SCM solo está disponible para personal autorizado' });
}

router.get('/productos', verifyToken, requireStaff, scm.getProducts);
router.get('/productos/:id/movimientos', verifyToken, requireAdmin, scm.getProductMovements);
router.post('/productos', verifyToken, requireAdmin, productImageUpload, scm.createProduct);
router.post('/productos/:id/imagen', verifyToken, requireAdmin, productImageUpload, scm.uploadProductImage);
router.put('/productos/:id/estrategia', verifyToken, requireAdmin, scm.updateStrategy);
router.put('/productos/:id', verifyToken, requireAdmin, productImageUpload, scm.updateProduct);
router.delete('/productos/:id', verifyToken, requireAdmin, scm.deleteProduct);

router.get('/proveedores', verifyToken, requireAdmin, scm.getProviders);
router.post('/proveedores', verifyToken, requireAdmin, scm.createProvider);
router.put('/proveedores/:id', verifyToken, requireAdmin, scm.updateProvider);
router.delete('/proveedores/:id', verifyToken, requireAdmin, scm.deleteProvider);

router.post('/inventario/movimiento', verifyToken, requireAdmin, scm.createMovement);
router.get('/inventario/movimientos', verifyToken, requireAdmin, scm.getAllMovements);

router.get('/pedidos', verifyToken, requireAdmin, scm.getOrders);
router.post('/pedidos', verifyToken, requireAdmin, scm.createOrder);
router.put('/pedidos/:id/estado', verifyToken, requireAdmin, scm.updateOrderStatus);

router.get('/scm/estado', verifyToken, requireAdmin, scm.getScmState);
router.put('/scm/nivel', verifyToken, requireAdmin, scm.updateScmLevel);

module.exports = router;
