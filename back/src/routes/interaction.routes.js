const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { createInteraction, getInteractionsByClient, getAllInteractions } = require('../controllers/interaction.controller');

const router = express.Router();

function requireAdmin(req, res, next) {
    if (['admin', 'super_administrador'].includes(req.user?.role)) return next();
    return res.status(403).json({ error: 'Solo un administrador puede acceder al historial CRM' });
}

function requireCrmStaff(req, res, next) {
    if (['admin', 'super_administrador', 'ventas'].includes(req.user?.role)) return next();
    return res.status(403).json({ error: 'El historial CRM solo está disponible para administración y ventas' });
}

router.post('/', verifyToken, requireCrmStaff, createInteraction);
router.get('/cliente/:clienteId', verifyToken, requireCrmStaff, getInteractionsByClient);
router.get('/todas', verifyToken, requireAdmin, getAllInteractions);

module.exports = router;