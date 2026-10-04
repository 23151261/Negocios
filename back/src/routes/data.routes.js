const express = require('express');
const { getData, saveData } = require('../controllers/data.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/:key', (req, res, next) => {
    if (req.params.key !== 'clients') return next();
    return verifyToken(req, res, () => {
        if (!['admin', 'super_administrador'].includes(req.user?.role)) {
            return res.status(403).json({ error: 'Solo un administrador puede consultar datos CRM' });
        }
        return getData(req, res);
    });
}, getData);
router.put('/:key', (req, res, next) => {
    const isClientWrite = req.params.key === 'clients';
    const isProductWrite = req.params.key === 'products';
    const containsScmMetadata = req.params.key === 'products'
        && Array.isArray(req.body)
        && req.body.some(product => product && typeof product === 'object'
            && ['minStock', 'strategy', 'unitCost', 'providerId']
            .some(field => Object.prototype.hasOwnProperty.call(product, field)));
    if (req.params.key.startsWith('scm_') || containsScmMetadata || isClientWrite || isProductWrite) {
        return verifyToken(req, res, next);
    }
    next();
}, saveData);

module.exports = router;