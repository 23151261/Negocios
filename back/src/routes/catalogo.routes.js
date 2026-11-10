const express = require('express');
const { getCatalogo, getProductoById, getCategorias } = require('../controllers/catalogo.controller');

const router = express.Router();

router.get('/', getCatalogo);
router.get('/categorias', getCategorias);
router.get('/:id', getProductoById);

module.exports = router;
