const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { getClients, getClientById, createClient, updateClient, deleteClient } = require('../controllers/client.controller');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

router.get('/', getClients);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

module.exports = router;