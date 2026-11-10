const express = require('express');
const { getImpuestos, createImpuesto, updateImpuesto } = require('../controllers/impuestos.controller');
const { verifyToken, requireRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getImpuestos);
router.post('/', verifyToken, requireRoles('admin', 'super_administrador'), createImpuesto);
router.put('/:id', verifyToken, requireRoles('admin', 'super_administrador'), updateImpuesto);

module.exports = router;
