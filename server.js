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
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdn.tailwindcss.com", "cdnjs.cloudflare.com", "unpkg.com", "cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com", "unpkg.com", "cdn.jsdelivr.net"],
      fontSrc: ["'self'", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "*"],
      connectSrc: ["'self'", "cdn.jsdelivr.net", "cdn.tailwindcss.com"],
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

// Environment validation (warn in production, but don't crash before server starts)
if (isProduction) {
  if (process.env.JWT_SECRET === 'smartfund_super_secret_key_change_this_2026' || !process.env.JWT_SECRET) {
    console.warn('[WARN] JWT_SECRET is not set or using default insecure value in production. Using fallback (fix in Railway dashboard).');
    process.env.JWT_SECRET = 'railway_default_jwt_' + Date.now();
  }
  if (process.env.SESSION_SECRET === 'smartfund_session_secret_2026' || !process.env.SESSION_SECRET) {
    console.warn('[WARN] SESSION_SECRET is not set or using default insecure value in production. Using fallback (fix in Railway dashboard).');
    process.env.SESSION_SECRET = 'railway_default_session_' + Date.now();
  }
  console.log('✔ Production environment validation passed (with fallbacks)');
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
// Static assets — short cache so CSS/JS updates deploy instantly
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), {
  maxAge: '0',
  etag: true,
  lastModified: true,
}));
// Everything else in public — no cache
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '0',
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

(async () => {
  // Auto-migrate: ensure withdrawal table & settings exist on startup
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        withdrawal_id VARCHAR(20) NOT NULL UNIQUE,
        member_id INT NOT NULL,
        nama VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        no_hp VARCHAR(20) NOT NULL,
        bank VARCHAR(50) NOT NULL,
        no_rekening VARCHAR(50) NOT NULL,
        nama_rekening VARCHAR(100) NOT NULL,
        jumlah DECIMAL(15,2) NOT NULL,
        status ENUM('menunggu_verifikasi','diproses','berhasil','ditolak') DEFAULT 'menunggu_verifikasi',
        catatan TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        processed_at DATETIME NULL,
        FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_status (status),
        INDEX idx_member (member_id),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB`);
    console.log('✔ Withdrawal table ready');

    // Ensure min_withdrawal setting exists
    const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'min_withdrawal'");
    if (rows.length === 0) {
      await db.query("INSERT INTO settings (setting_key, setting_value, description) VALUES ('min_withdrawal', '100000', 'Minimum penarikan dana (Rp)')");
      console.log('✔ min_withdrawal setting added');
    }
  } catch (err) {
    console.error('✘ Auto-migration failed:', err.message);
  }

  // CS Code System: auto-migrate new columns for existing databases
  try {
    const migrations = [
      { table: 'admins', col: 'cs_code', definition: 'VARCHAR(50) AFTER role', unique: true },
      { table: 'users', col: 'cs_id', definition: 'INT NULL AFTER status', index: 'idx_cs' },
      { table: 'loan_applications', col: 'cs_id', definition: 'INT NULL AFTER user_id', index: 'idx_cs' },
      { table: 'loan_applications', col: 'cs_code', definition: 'VARCHAR(50) NULL AFTER cs_id', index: false },
    ];

    for (const m of migrations) {
      try {
        const [check] = await db.query(
          'SELECT COUNT(*) as cnt FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
          [m.table, m.col]
        );
        if (check[0].cnt === 0) {
          await db.query(`ALTER TABLE ${m.table} ADD COLUMN ${m.col} ${m.definition}`);
          console.log(`[OK] Migrated: added ${m.col} to ${m.table}`);
        }
        if (m.unique) {
          const [idxCheck] = await db.query(
            'SELECT COUNT(*) as cnt FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = ? AND constraint_type = \'UNIQUE\'',
            [m.table, `uk_${m.table}_${m.col}`]
          );
          if (idxCheck[0].cnt === 0) {
            await db.query(`ALTER TABLE ${m.table} ADD CONSTRAINT uk_${m.table}_${m.col} UNIQUE (${m.col})`);
            console.log(`[OK] Migrated: added unique constraint on ${m.table}.${m.col}`);
          }
        }
        if (m.index) {
          const [idxCheck2] = await db.query(
            "SELECT COUNT(*) as cnt FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?",
            [m.table, m.index]
          );
          if (idxCheck2[0].cnt === 0) {
            await db.query(`ALTER TABLE ${m.table} ADD INDEX ${m.index} (${m.col})`);
            console.log(`[OK] Migrated: added index ${m.index} to ${m.table}`);
          }
        }
      } catch (merr) {
        console.error(`[WARN] Migration failed for ${m.table}.${m.col}:`, merr.message);
      }
    }

    // Backfill cs_code for existing admins
    const [adminRows] = await db.query('SELECT id, cs_code FROM admins WHERE cs_code IS NULL OR cs_code = \'\'');
    for (const a of adminRows) {
      const code = 'CS' + String(a.id).padStart(2, '0');
      await db.query('UPDATE admins SET cs_code = ? WHERE id = ?', [code, a.id]);
      console.log(`[OK] Backfilled cs_code ${code} for admin id=${a.id}`);
    }

    // Backfill loan_applications cs_id & cs_code from users
    const [loanRows] = await db.query(`
      SELECT la.id, la.user_id FROM loan_applications la WHERE la.cs_id IS NULL
    `);
    for (const la of loanRows) {
      await db.query(`
        UPDATE loan_applications la JOIN users u ON la.user_id = u.id
        LEFT JOIN admins a ON u.cs_id = a.id
        SET la.cs_id = u.cs_id, la.cs_code = a.cs_code
        WHERE la.id = ?
      `, [la.id]);
    }
    if (loanRows.length > 0) console.log(`[OK] Backfilled cs_id/cs_code for ${loanRows.length} loan applications`);
  } catch (migrationErr) {
    console.error('✘ CS Code migration failed:', migrationErr.message);
  }
})();

module.exports = app;