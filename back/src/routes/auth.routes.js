const express = require('express');
const { register, registerAdmin, getAdmins, deleteAdmin, login } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/admin-register', verifyToken, registerAdmin);
router.get('/admins', verifyToken, getAdmins);
router.delete('/admins/:id', verifyToken, deleteAdmin);
router.post('/login', login);

module.exports = router;