const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');

// DEBUG: เช็คว่า controller export อะไรออกมาบ้าง
console.log('AUTH CONTROLLER FUNCTIONS:', Object.keys(authController));

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);

// กัน server ล้ม ถ้า resetPassword ยัง export ไม่ออก
router.post('/reset-password', (req, res, next) => {
  if (typeof authController.resetPassword !== 'function') {
    console.error('❌ resetPassword is not exported from auth.controller.js');

    return res.status(500).json({
      ok: false,
      message: 'resetPassword function is missing in auth.controller.js',
      availableFunctions: Object.keys(authController),
    });
  }

  return authController.resetPassword(req, res, next);
});

module.exports = router;