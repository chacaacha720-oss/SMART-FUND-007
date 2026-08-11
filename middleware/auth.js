/**
 * SMART FUND - Authentication Middleware
 * JWT verification untuk user & admin
 */
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { t } = require('../config/i18n');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_not_secure';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'dev_jwt_secret_not_secure') {
  console.error('[FATAL] JWT_SECRET environment variable not set in production');
  process.exit(1);
}

/**
 * Verifikasi JWT token user (Bearer token)
 */
async function authUser(req, res, next) {
  const lang = req.lang || 'id';
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: t(lang, 'auth.tokenNotFound') });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'user') {
      return res.status(403).json({ success: false, message: t(lang, 'auth.notUser') });
    }

    const [rows] = await db.query('SELECT id, full_name, email, phone, status, admin_id FROM users WHERE id = ?', [decoded.id]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: t(lang, 'auth.userNotFound') });
    }
    const user = rows[0];
    if (user.status === 'frozen') {
      return res.status(403).json({ success: false, message: t(lang, 'auth.accountFrozen') });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: t(lang, 'auth.tokenInvalid') });
  }
}

/**
 * Verifikasi JWT token admin
 */
async function authAdmin(req, res, next) {
  const lang = req.lang || 'id';
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: t(lang, 'auth.adminTokenNotFound') });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: t(lang, 'auth.notAdmin') });
    }

    const [rows] = await db.query('SELECT id, username, email, full_name, role, admin_code, status FROM admins WHERE id = ?', [decoded.id]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: t(lang, 'auth.adminNotFound') });
    }
    if (rows[0].status !== 'active') {
      return res.status(403).json({ success: false, message: t(lang, 'auth.adminInactive') });
    }
    req.admin = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: t(lang, 'auth.adminTokenInvalid') });
  }
}

/**
 * Optional auth - tidak wajib, tapi decode token jika ada
 */
async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token = header.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role === 'user') {
         const [rows] = await db.query('SELECT id, full_name, email, phone, status, admin_id FROM users WHERE id = ?', [decoded.id]);
         if (rows.length > 0 && rows[0].status !== 'frozen') req.user = rows[0];
      }
    }
  } catch (e) {
    // ignore
  }
  next();
}

module.exports = { authUser, authAdmin, optionalAuth, JWT_SECRET };