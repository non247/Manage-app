const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/Dashboard.controller');
console.log('🔥 DASHBOARD ROUTE LOADED');

router.get('/dashboard', dashboardController.getDashboard);

module.exports = router;



// const express = require('express');
// const router = express.Router();
// const dashboardController = require('../controller/Dashboard.controller');

// router.get('/dashboard', dashboardController.getDashboard);

// module.exports = router;