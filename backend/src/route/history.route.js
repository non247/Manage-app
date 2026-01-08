const express = require('express');
const router = express.Router();
const historyController = require('../controller/history.controller');

router.get('/history', historyController.getHistory);
router.post('/history', historyController.createHistory);
router.put('/history/:id', historyController.updateHistory);
router.delete('/history/:id', historyController.deleteHistory);

module.exports = router;
