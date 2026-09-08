const express = require('express');
const { register, registerAdmin, login } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/admin-register', verifyToken, registerAdmin);
router.post('/login', login);

module.exports = router;