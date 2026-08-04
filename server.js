/**
 * SMART FUND - Main Server
 * Platform Pinjaman Online Terpercaya
 * Node.js + Express + MySQL + Telegram Bot
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const session = require('express-session');

const routes = require('./routes');
const { notFound, multerErrorHandler, globalErrorHandler } = require('./middleware/errorHandler');
const { getTelegramSettings, handleTelegramWebhookUpdate } = require('./config/telegram');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(helmet({
  contentSecurityPolicy: false, // disabled for CDN resources
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN,
  credentials: true,
}));

// Global rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak request. Coba lagi nanti.' },
});

// ============================================
// PARSER & SESSION
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'smartfund_session_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// ============================================
// STATIC FILES
// ============================================
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// ROUTES
// ============================================
app.use('/api', apiLimiter, routes);

app.post('/api/telegram/webhook', async (req, res) => {
  const update = req.body || {};

  try {
    const config = await getTelegramSettings();
    const result = await handleTelegramWebhookUpdate(update, config.botToken);
    res.json({ ok: true, success: result.success, message: result.message });
  } catch (err) {
    console.error('[Telegram Webhook] Error:', err.message);
    res.status(500).json({ ok: false, success: false, message: 'Telegram webhook error' });
  }
});

// SPA fallback: serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// ERROR HANDLERS
// ============================================
app.use(notFound);
app.use(multerErrorHandler);
app.use(globalErrorHandler);

// ============================================
// START SERVER
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('============================================');
  console.log('  SMART FUND - Platform Pinjaman Online');
  console.log('============================================');
  console.log(`  Server running on http://0.0.0.0:${PORT}`);
  console.log(`  API base: http://0.0.0.0:${PORT}/api`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('============================================');
  console.log('');
  console.log('  (jalankan: npm run db:init untuk setup database)');
  console.log('');
});

module.exports = app;