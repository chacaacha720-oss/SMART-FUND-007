/**
 * SMART FUND - User Routes
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const userController = require('../controllers/userController');
const { authUser } = require('../middleware/auth');

// Multer config untuk upload dokumen
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'doc-' + unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Hanya file gambar yang diperbolehkan'), false);
  },
});

router.get('/dashboard', authUser, userController.dashboard);
router.get('/transactions', authUser, userController.transactions);
router.get('/notifications', authUser, userController.notifications);
router.post('/withdrawals', authUser, userController.createWithdrawal);
router.put('/notifications/:id/read', authUser, userController.readNotification);
router.put('/profile', authUser, userController.updateProfile);
router.put('/settings', authUser, userController.updateSettings);
router.post('/upload-document', authUser, upload.single('document'), userController.uploadDocument);

module.exports = router;