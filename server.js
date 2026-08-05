/**
 * SMART FUND - Main Server
 * Platform Pinjaman Online Terpercaya
 * Node.js + Express + MySQL + Telegram Bot
 * 
 * Railway compatible - uses Environment Variables only.
 * No hardcoded localhost. Uses process.env.PORT || 3000.
 */
// Load .env only in local/development; Railway provides env vars at runtime
if (process.env.NODE_ENV !== 'production' && !process.env.RAILWAY_ENVIRONMENT) {
  require('dotenv').config();
}

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');

const routes = require('./routes');
const { notFound, multerErrorHandler, globalErrorHandler } = require('./middleware/errorHandler');
const { i18nMiddleware } = require('./middleware/i18n');
const { getTelegramSettings, handleTelegramWebhookUpdate } = require('./config/telegram');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// STARTUP LOGGING
// ============================================
console.log('============================================');
console.log('  SMART FUND - Platform Pinjaman Online');
console.log('============================================');
console.log('✔ Environment Loaded');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`  PORT: ${PORT}`);

// Detect Railway environment
if (process.env.RAILWAY_SERVICE_NAME || process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_DATABASE_ID) {
  console.log('✔ Railway Environment Loaded');
} else if (process.env.DATABASE_URL || process.env.MYSQL_PRIVATE_URL) {
  console.log('✔ Railway/Cloud Database URL Detected');
} else {
  console.log('✔ Local Environment');
}

// ============================================
// AUTO-CREATE UPLOADS FOLDER
// ============================================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✔ Uploads folder created:', uploadDir);
} else {
  console.log('✔ Uploads folder exists:', uploadDir);
}

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
  // Message is localized by the i18n middleware
  message: (req) => {
    const { t } = require('./config/i18n');
    const lang = req.lang || 'id';
    return { success: false, message: t(lang, 'error.tooManyRequests') };
  },
});

// ============================================
// PARSER & SESSION
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session - secure cookies only in production with a proper PROXY_TRUST setting
const isProduction = process.env.NODE_ENV === 'production';
app.set('trust proxy', isProduction ? 1 : false);

app.use(session({
  secret: process.env.SESSION_SECRET || 'smartfund_session_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction && process.env.COOKIE_SECURE === 'true',
    httpOnly: true,
    sameSite: 'lax',
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
app.use('/api', i18nMiddleware, apiLimiter, routes);

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
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('✔ Server Running');
  console.log('============================================');
  console.log(`  Server: http://0.0.0.0:${PORT}`);
  console.log(`  API:    http://0.0.0.0:${PORT}/api`);
  console.log(`  Env:    ${process.env.NODE_ENV || 'development'}`);
  console.log('============================================');
  console.log('  (jalankan: npm run db:init untuk setup database)');
  console.log('');
});

// ============================================
// GLOBAL UNHANDLED ERROR HANDLING
// ============================================
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message);
  console.error(err.stack);
  // Don't crash - log and continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise);
  console.error('[FATAL] Reason:', reason);
  // Don't crash - log and continue
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('✔ SIGTERM received - shutting down gracefully...');
  server.close(() => {
    console.log('✔ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('✔ SIGINT received - shutting down gracefully...');
  server.close(() => {
    console.log('✔ Server closed');
    process.exit(0);
  });
});

module.exports = app;