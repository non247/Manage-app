const express = require('express');
const router = express.Router();
const controller = require('../controller/purchase.controller');

/* ===== CRUD ===== */
router.get('/', controller.getAllPurchase);
router.post('/', controller.createPurchase);
router.put('/:id', controller.updatePurchase);
router.delete('/:id', controller.deletePurchase);

module.exports = router;
