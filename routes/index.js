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

router.use('/auth', authRoutes);
router.use('/loans', loanRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);

// Health check - localized message
router.get('/health', (req, res) => {
  res.json({ success: true, message: req.t ? req.t('health.running') : 'SMART FUND API running', time: new Date().toISOString() });
});

module.exports = router;
