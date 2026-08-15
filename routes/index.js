/**
 * SMART FUND - Routes Index
 * Menggabungkan semua route API
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db');

const authRoutes = require('./authRoutes');
const loanRoutes = require('./loanRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const withdrawalRoutes = require('./withdrawalRoutes');

router.use('/auth', authRoutes);
router.use('/loans', loanRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/admin/withdrawals', withdrawalRoutes.adminRouter);

// Public banner endpoint for homepage
router.get('/banners', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM settings WHERE setting_key = "promo_banners"');
    let banners = [];
    if (rows.length > 0) {
      try {
        banners = JSON.parse(rows[0].setting_value);
      } catch (e) {
        banners = [];
      }
    }
    // Return only active banners for public
    const activeBanners = banners.filter(b => b.active).sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json({ success: true, data: activeBanners });
  } catch (err) {
    console.error('Get public banners error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.use('/auth', authRoutes);
router.use('/loans', loanRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/admin/withdrawals', withdrawalRoutes.adminRouter);

// Health check - localized message with database status
router.get('/health', async (req, res) => {
  try {
    const dbOk = typeof db.isConnected === 'function' ? db.isConnected() : true;
    res.json({
      success: true,
      message: req.t ? req.t('health.running') : 'SMART FUND API running',
      database: dbOk ? 'connected' : 'disconnected',
      time: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      database: 'error',
      time: new Date().toISOString(),
    });
  }
});

module.exports = router;
