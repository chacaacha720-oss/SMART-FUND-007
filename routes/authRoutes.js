/**
 * SMART FUND - Auth Routes
 */
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authUser } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validate');
const { t } = require('../config/i18n');

// Rate limiter untuk auth - localized message
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: (req) => {
    const lang = req.lang || 'id';
    return { success: false, message: t(lang, 'error.tooManyRequests') };
  },
});

router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/verify-otp', authLimiter, authController.verifyOtp);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.get('/me', authUser, authController.me);

module.exports = router;