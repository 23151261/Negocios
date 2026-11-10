const express = require('express');
const { verifyToken, requireRoles } = require('../middleware/auth.middleware');
const {
    createTicket,
    getTickets,
    getTicketsByCliente,
    getTicketById,
    responderTicket
} = require('../controllers/atencion.controller');

const router = express.Router();

router.post('/ticket', verifyToken, requireRoles('usuario'), createTicket);
router.get('/tickets', verifyToken, requireRoles('admin', 'super_administrador', 'ventas', 'soporte'), getTickets);
router.get('/tickets/cliente/:cliente_id', verifyToken, requireRoles('usuario'), getTicketsByCliente);
router.get('/ticket/:id', verifyToken, getTicketById);
router.put('/ticket/:id/respuesta', verifyToken, requireRoles('admin', 'super_administrador', 'soporte'), responderTicket);

module.exports = router;
