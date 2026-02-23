const express = require('express');
const router = express.Router();

const historyController = require('../controller/history.controller');

router.get('/', historyController.getHistory);
router.post('/', historyController.createHistory);
router.put('/:id', historyController.updateHistory);
router.delete('/:id', historyController.deleteHistory);

module.exports = router;
