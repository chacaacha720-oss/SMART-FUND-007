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
const withdrawalRoutes = require('./withdrawalRoutes');
const db = require('../config/db');

router.use('/auth', authRoutes);
router.use('/loans', loanRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/admin/withdrawals', withdrawalRoutes.adminRouter);

// Test telegram notification (dev only — remove in production)
router.get('/test/telegram', async (req, res) => {
  try {
    const telegram = require('../config/telegram');
    const message = await telegram.buildWithdrawalNotification({
      withdrawalId: 'WD-TEST-000001',
      userId: '10213',
      fullName: 'Ahmad Bin Ali',
      phone: '+62xxxxxxxxxx',
      email: 'ahmad@email.com',
      bank: 'BRI',
      accountNumber: '123456789',
      accountHolder: 'Ahmad Bin Ali',
      amount: 1000000,
      lang: 'id',
    });
    const result = await telegram.sendTelegram(message, { parseMode: 'HTML' });
    console.log('[TEST] Telegram send result:', result);
    res.json({ success: true, sent: result.success, message: result.message || 'OK' });
  } catch (err) {
    console.error('[TEST] Telegram error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

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
