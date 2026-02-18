const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/Dashboard.controller');
console.log('🔥 DASHBOARD ROUTE LOADED');

router.get('/', dashboardController.getDashboard);

module.exports = router;
