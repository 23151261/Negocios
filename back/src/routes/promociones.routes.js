const express = require('express');
const { verifyToken, requireRoles } = require('../middleware/auth.middleware');
const {
    getPromociones,
    createPromocion,
    updatePromocion,
    deletePromocion
} = require('../controllers/promociones.controller');

const router = express.Router();

router.get('/', getPromociones);
router.post('/', verifyToken, requireRoles('admin', 'super_administrador', 'ventas'), createPromocion);
router.put('/:id', verifyToken, requireRoles('admin', 'super_administrador', 'ventas'), updatePromocion);
router.delete('/:id', verifyToken, requireRoles('admin', 'super_administrador'), deletePromocion);

module.exports = router;
