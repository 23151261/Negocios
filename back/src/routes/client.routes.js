const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { getClients, getClientById, createClient, updateClient, updateClientStage, updateOwnClientProfile, updateOwnClientImage, getClientMetrics, deleteClient } = require('../controllers/client.controller');
const { getInteractionsByClient } = require('../controllers/interaction.controller');
const { clientImageUpload } = require('../middleware/imageUpload.middleware');

const router = express.Router();

router.put('/perfil', verifyToken, updateOwnClientProfile);
router.put('/perfil/imagen', verifyToken, clientImageUpload, updateOwnClientImage);

function requireCrmStaff(req, res, next) {
    if (['admin', 'super_administrador', 'ventas'].includes(req.user?.role)) return next();
    return res.status(403).json({ error: 'El CRM solo está disponible para administración y ventas' });
}

function requireAdmin(req, res, next) {
    if (['admin', 'super_administrador'].includes(req.user?.role)) return next();
    return res.status(403).json({ error: 'Solo un administrador puede eliminar clientes' });
}

router.get('/', verifyToken, requireCrmStaff, getClients);
router.get('/metricas', verifyToken, requireCrmStaff, getClientMetrics);
router.get('/:id/interacciones', verifyToken, requireCrmStaff, getInteractionsByClient);
router.get('/:id', verifyToken, requireCrmStaff, getClientById);
router.post('/', verifyToken, requireCrmStaff, clientImageUpload, createClient);
router.put('/:id', verifyToken, requireCrmStaff, clientImageUpload, updateClient);
router.put('/:id/etapa', verifyToken, requireCrmStaff, updateClientStage);
router.delete('/:id', verifyToken, requireAdmin, deleteClient);

module.exports = router;
