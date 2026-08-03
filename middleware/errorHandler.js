/**
 * SMART FUND - Error Handler Middleware
 * Menangani error global & Multer errors
 */

// 404 handler
function notFound(req, res, next) {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
}

// Multer error handler (file upload)
function multerErrorHandler(err, req, res, next) {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Ukuran file maksimal 5MB' });
  }
  if (err && err.message && err.message.includes('file gambar')) {
    return res.status(400).json({ success: false, message: 'Hanya file gambar (JPG/PNG) yang diperbolehkan' });
  }
  next(err);
}

// Global error handler
function globalErrorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message || err);
  if (res.headersSent) return next(err);

  const status = err.status || 500;
  const message = err.message || 'Terjadi kesalahan server';

  // Jangan expose stack trace di production
  const response = { success: false, message };
  if (process.env.NODE_ENV === 'development' && err.stack) response.stack = err.stack;

  res.status(status).json(response);
}

module.exports = { notFound, multerErrorHandler, globalErrorHandler };