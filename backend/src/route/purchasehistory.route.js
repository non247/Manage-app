const express = require('express');
const router = express.Router();
const controller = require('../controller/purchasehistory.controller');

router.get('/', controller.getHistoryPurchase);
router.post('/', controller.createHistoryPurchase);
router.put('/:id', controller.updateHistoryPurchase);
router.delete('/:id', controller.deleteHistoryPurchase);

module.exports = router;
