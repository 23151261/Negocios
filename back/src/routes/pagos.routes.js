const express = require('express');
const { procesarPago, enviarComprobanteFiscal, getPagos, getPagoById } = require('../controllers/pagos.controller');
const { verifyToken, requireRoles } = require('../middleware/auth.middleware');

const router = express.Router();

function authenticateIfProvided(req, res, next) {
    if (!req.headers.authorization) return next();
    return verifyToken(req, res, next);
}

router.post('/procesar', authenticateIfProvided, procesarPago);
router.post('/enviar-comprobante-fiscal', authenticateIfProvided, enviarComprobanteFiscal);
router.get('/', verifyToken, requireRoles('admin', 'super_administrador', 'ventas'), getPagos);
router.get('/:id', verifyToken, requireRoles('admin', 'super_administrador', 'ventas'), getPagoById);

module.exports = router;
