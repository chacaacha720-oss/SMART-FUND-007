/**
 * SMART FUND - Admin Routes
 */
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const adminController = require('../controllers/adminController');
const { authAdmin } = require('../middleware/auth');

// Rate limiter untuk admin login
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi nanti.' },
});

// Public admin auth
router.post('/auth/login', adminLoginLimiter, adminController.adminLogin);

// Protected admin routes
router.use(authAdmin);

router.get('/me', adminController.adminMe);
router.get('/dashboard', adminController.adminDashboard);

// Manajemen user
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', adminController.updateUser);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// Manajemen pinjaman
router.get('/applications', adminController.listApplications);
router.get('/applications/:id', adminController.getApplication);
router.put('/applications/:id', adminController.updateApplication);
router.put('/applications/:id/status', adminController.updateApplicationStatus);

// Manajemen transaksi & withdraw
router.get('/transactions', adminController.listTransactions);
router.put('/transactions/:id/status', adminController.updateTransactionStatus);

// Settings & Telegram
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);
router.get('/telegram/logs', adminController.telegramLogs);
router.post('/telegram/test', adminController.telegramTest);

module.exports = router;