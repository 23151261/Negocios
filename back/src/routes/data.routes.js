const express = require('express');
const { getData, saveData } = require('../controllers/data.controller');

const router = express.Router();

router.get('/:key', getData);
router.put('/:key', saveData);

module.exports = router;