/**
 * SMART FUND - Main Server
 * Platform Pinjaman Online Terpercaya
 * Node.js + Express + MySQL + Telegram Bot
 * 
 * Railway compatible - uses Environment Variables only.
 * No hardcoded localhost. Uses process.env.PORT || 3000.
 * Version 1.0.2 - Mobile blur fix deployment
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
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');

const routes = require('./routes');
const { notFound, multerErrorHandler, globalErrorHandler } = require('./middleware/errorHandler');
const { i18nMiddleware } = require('./middleware/i18n');
const { getTelegramSettings, handleTelegramWebhookUpdate } = require('./config/telegram');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

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
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com", "cdnjs.cloudflare.com", "unpkg.com", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com", "unpkg.com", "cdn.jsdelivr.net"],
      fontSrc: ["'self'", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "*"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
}));
const corsOrigins = process.env.CORS_ORIGIN === '*'
  ? true
  : (process.env.CORS_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (corsOrigins === true) return callback(null, true);
    if (!origin || corsOrigins.includes(origin)) return callback(null, origin);
    callback(new Error('Not allowed by CORS'));
  },
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

app.use(compression({ threshold: 1024 }));

// ============================================
// PARSER & SESSION
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const lang = req.lang || 'id';
    return res.status(400).json({ success: false, message: require('./config/i18n').t(lang, 'error.invalidJson') || 'Invalid JSON payload' });
  }
  next(err);
});

// Environment validation (fail fast in production)
if (isProduction) {
  if (process.env.JWT_SECRET === 'smartfund_super_secret_key_change_this_2026' || !process.env.JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET is not set or using default insecure value in production');
    process.exit(1);
  }
  if (process.env.SESSION_SECRET === 'smartfund_session_secret_2026' || !process.env.SESSION_SECRET) {
    console.error('[FATAL] SESSION_SECRET is not set or using default insecure value in production');
    process.exit(1);
  }
  console.log('✔ Production environment validation passed');
}

// Session configuration with secure settings
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
};

app.set('trust proxy', isProduction ? 1 : false);
app.use(session(sessionConfig));

// ============================================
// STATIC FILES
// ============================================
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1y',
  etag: true,
}));

// ============================================
// ROUTES
// ============================================
app.use('/api', i18nMiddleware, apiLimiter, routes);

app.post('/api/telegram/webhook', async (req, res, next) => {
  const update = req.body || {};
  try {
    const config = await getTelegramSettings();
    const result = await handleTelegramWebhookUpdate(update, config.botToken);
    res.json({ ok: true, success: result.success, message: result.message });
  } catch (err) {
    next(err);
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
const gracefulShutdown = async (signal) => {
  console.log(`✔ ${signal} received - shutting down gracefully...`);
  try {
    await db.end();
    console.log('✔ Database pool closed');
  } catch (err) {
    console.error('[DB] Error closing pool:', err.message);
  }
  server.close(() => {
    console.log('✔ Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[FATAL] Could not close connections gracefully, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;