const express = require('express');
const router = express.Router();

const dashboardController = require('../controller/Dashboard.controller');

router.get('/', dashboardController.getDashboard);

module.exports = router;
