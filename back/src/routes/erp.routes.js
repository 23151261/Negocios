const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const erp = require('../controllers/erp.controller');

const router = express.Router();

function requireStaff(req, res, next) {
    if (['admin', 'super_administrador', 'ventas', 'logistica'].includes(req.user?.role)) {
        return next();
    }
    return res.status(403).json({ error: 'Acceso restringido a personal de administración, ventas o logística' });
}

function requireAdmin(req, res, next) {
    if (['admin', 'super_administrador'].includes(req.user?.role)) {
        return next();
    }
    return res.status(403).json({ error: 'Solo un administrador puede realizar esta acción' });
}

// ─── Órdenes de clientes (ERP) ──────────────────────────────
router.get('/ordenes', verifyToken, requireStaff, erp.getOrders);
router.get('/ordenes/:id', verifyToken, requireStaff, erp.getOrderById);
router.post('/ordenes', verifyToken, requireStaff, erp.createOrder);
router.put('/ordenes/:id', verifyToken, requireStaff, erp.updateOrder);
router.put('/ordenes/:id/estado', verifyToken, requireStaff, erp.updateOrder);

// ─── Inventario Integral ERP (CRM + SCM) ────────────────────
router.get('/inventario', verifyToken, requireAdmin, erp.getErpInventory);
router.get('/inventario/:id', verifyToken, requireAdmin, erp.getErpInventoryItemDetail);

// ─── Indicadores y métricas ERP ─────────────────────────────
router.get('/metricas', verifyToken, requireStaff, erp.getMetrics);

// ─── Nivel de implementación ERP ───────────────────────────
router.get('/estado', verifyToken, requireAdmin, erp.getErpState);
router.put('/estado', verifyToken, requireAdmin, erp.updateErpState);

// ─── Roles empresariales ────────────────────────────────────
router.get('/roles', verifyToken, requireAdmin, erp.getRoles);

module.exports = router;
