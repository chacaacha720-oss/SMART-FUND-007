/**
 * SMART FUND - Error Handler Middleware
 * Menangani error global & Multer errors
 */
const { t } = require('../config/i18n');

// 404 handler
function notFound(req, res, next) {
  const lang = req.lang || 'id';
  res.status(404).json({ success: false, message: t(lang, 'error.notFound') });
}

// Multer error handler (file upload)
function multerErrorHandler(err, req, res, next) {
  const lang = req.lang || 'id';
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: t(lang, 'error.fileSize') });
  }
  if (err && err.message && err.message.includes('file gambar')) {
    return res.status(400).json({ success: false, message: t(lang, 'error.fileImage') });
  }
  next(err);
}

// Global error handler
function globalErrorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message || err);
  if (res.headersSent) return next(err);

  const status = err.status || 500;
  const lang = req.lang || 'id';

  // Database-specific error handling - don't expose internals, but give clear feedback
  let message = t(lang, 'error.server');

  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    message = 'Sambungan pangkal data gagal. Semak DB_HOST/DB_PORT dalam .env atau pemboleh ubah Railway.';
    console.error('[DB ERROR] Database connection refused. Check DB_HOST/DB_PORT in .env or Railway variables.');
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    message = 'Akses pangkal data ditolak. Semak DB_USER dan DB_PASSWORD.';
    console.error('[DB ERROR] Access denied. Check DB_USER/DB_PASSWORD in .env or Railway variables.');
  } else if (err.code === 'ER_BAD_DB_ERROR') {
    message = 'Pangkal data tidak dijumpai. Jalankan: npm run db:init';
    console.error('[DB ERROR] Unknown database. Run: npm run db:init');
  } else if (err.message && err.message.includes('Cannot find module')) {
    message = 'Modul tidak dijumpai. Jalankan: npm install';
    console.error('[MODULE ERROR] Dependency missing. Run: npm install');
  } else if (err.code === 'ENOENT') {
    message = 'File or directory not found.';
    console.error('[FS ERROR] File not found:', err.path);
  }

  // Jangan expose stack trace di production
  const response = { success: false, message };
  if (process.env.NODE_ENV === 'development' && err.stack) response.stack = err.stack;

  res.status(status).json(response);
}

module.exports = { notFound, multerErrorHandler, globalErrorHandler };