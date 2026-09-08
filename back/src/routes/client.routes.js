const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { getClients, getClientById, createClient, updateClient, updateClientStage, getClientMetrics, deleteClient } = require('../controllers/client.controller');
const { getInteractionsByClient } = require('../controllers/interaction.controller');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

router.get('/', getClients);
router.get('/metricas', getClientMetrics);
router.get('/:id/interacciones', getInteractionsByClient);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);
router.put('/:id/etapa', updateClientStage);
router.delete('/:id', deleteClient);

module.exports = router;
