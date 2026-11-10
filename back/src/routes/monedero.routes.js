const express = require('express');
const { getMonederoCliente, recargarMonedero, ajusteMonedero, getReportesMonedero } = require('../controllers/monedero.controller');
const { verifyToken, requireRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/reportes', verifyToken, requireRoles('admin', 'super_administrador'), getReportesMonedero);
router.post('/recargar', verifyToken, requireRoles('usuario'), recargarMonedero);
router.post('/ajuste', verifyToken, requireRoles('admin', 'super_administrador'), ajusteMonedero);
router.get('/:cliente_id', verifyToken, getMonederoCliente);

module.exports = router;
