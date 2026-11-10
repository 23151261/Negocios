const express = require('express');
const {
    register,
    registerAdmin,
    getAdmins,
    deleteAdmin,
    login,
    getPerfil,
    updatePerfil,
    logout
} = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/registro', register);
router.post('/admin-register', verifyToken, registerAdmin);
router.get('/admins', verifyToken, getAdmins);
router.delete('/admins/:id', verifyToken, deleteAdmin);
router.post('/login', login);
router.post('/logout', logout);
router.get('/perfil', verifyToken, getPerfil);
router.put('/perfil', verifyToken, updatePerfil);

module.exports = router;
