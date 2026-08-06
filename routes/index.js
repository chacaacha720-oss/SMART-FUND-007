/**
 * SMART FUND - Routes Index
 * Menggabungkan semua route API
 */
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const loanRoutes = require('./loanRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const db = require('../config/db');

router.use('/auth', authRoutes);
router.use('/loans', loanRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);

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
