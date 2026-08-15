/**
 * SMART FUND - Admin Routes
 */
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const adminController = require('../controllers/adminController');
const { authAdmin } = require('../middleware/auth');

// Banner image upload config
const bannerUploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(bannerUploadDir)) {
  fs.mkdirSync(bannerUploadDir, { recursive: true });
}
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, bannerUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `banner-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});
const bannerUpload = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Fail mesti imej (jpg/png/gif/webp)'));
  },
});

// Rate limiter untuk admin login
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Terlalu banyak percubaan log masuk. Cuba semula kemudian.' },
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

// === CS Code Management (Super Admin only) ===
router.get('/cs-codes', adminController.listCsCodes);
router.get('/cs-codes/:id', adminController.getCsCode);
router.post('/cs-codes', adminController.createCsCode);
router.put('/cs-codes/:id', adminController.updateCsCode);
router.delete('/cs-codes/:id', adminController.deleteCsCode);

// Settings & Telegram
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);
router.get('/telegram/logs', adminController.telegramLogs);
router.post('/telegram/test', adminController.telegramTest);

// Promo Banner Management
router.get('/banners', adminController.getBanners);
router.post('/banners', adminController.createBanner);
router.put('/banners/:id', adminController.updateBanner);
router.delete('/banners/:id', adminController.deleteBanner);
router.post('/banners/upload', bannerUpload.single('image'), adminController.uploadBannerImage);

// Bulk operations
router.put('/users/bulk/limit', adminController.bulkUpdateUserLimit);

module.exports = router;