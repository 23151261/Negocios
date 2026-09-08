const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { createInteraction, getInteractionsByClient, getAllInteractions } = require('../controllers/interaction.controller');

const router = express.Router();

router.use(verifyToken);

router.post('/', createInteraction);
router.get('/cliente/:clienteId', getInteractionsByClient);
router.get('/todas', getAllInteractions);

module.exports = router;