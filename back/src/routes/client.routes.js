const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { getClients, getClientById, createClient, updateClient, updateClientStage, updateOwnClientProfile, getClientMetrics, deleteClient } = require('../controllers/client.controller');
const { getInteractionsByClient } = require('../controllers/interaction.controller');

const router = express.Router();

router.put('/perfil', verifyToken, updateOwnClientProfile);

function requireAdmin(req, res, next) {
    if (['admin', 'super_administrador'].includes(req.user?.role)) return next();
    return res.status(403).json({ error: 'Solo un administrador puede acceder al CRM' });
}

router.use(verifyToken, requireAdmin);

router.get('/', getClients);
router.get('/metricas', getClientMetrics);
router.get('/:id/interacciones', getInteractionsByClient);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);
router.put('/:id/etapa', updateClientStage);
router.delete('/:id', deleteClient);

module.exports = router;
