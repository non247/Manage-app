const express = require('express');
const router = express.Router();
const inventoryController = require('../controller/inventory.controller');

router.get('/inventoryController', inventoryController.getInventory);
router.post('/inventoryController', inventoryController.createInventory);
router.put('/inventoryController/:id', inventoryController.updateInventory);
router.delete('/inventoryController/:id', inventoryController.deleteInventory);

module.exports = router;
