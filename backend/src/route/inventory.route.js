const express = require('express');
const router = express.Router();
const inventoryController = require('../controller/inventory.controller');

router.get('/inventory', inventoryController.getInventory);
router.post('/inventory', inventoryController.createInventory);
router.put('/inventory/:id', inventoryController.updateInventory);
router.delete('/inventory/:id', inventoryController.deleteInventory);

module.exports = router;
