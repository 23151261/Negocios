const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { createInteraction, getInteractionsByClient, getAllInteractions } = require('../controllers/interaction.controller');

const router = express.Router();

function requireAdmin(req, res, next) {
    if (['admin', 'super_administrador'].includes(req.user?.role)) return next();
    return res.status(403).json({ error: 'Solo un administrador puede acceder al historial CRM' });
}

router.use(verifyToken, requireAdmin);

router.post('/', createInteraction);
router.get('/cliente/:clienteId', getInteractionsByClient);
router.get('/todas', getAllInteractions);

module.exports = router;