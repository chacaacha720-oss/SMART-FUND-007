/**
 * SMART FUND - Authentication Middleware
 * JWT verification untuk user & admin
 */
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'smartfund_super_secret_key_change_this_2026';

/**
 * Verifikasi JWT token user (Bearer token)
 */
async function authUser(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan. Silakan login.' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Akses ditolak. Bukan akun user.' });
    }

    const [rows] = await db.query('SELECT id, full_name, email, phone, status FROM users WHERE id = ?', [decoded.id]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User tidak ditemukan.' });
    }
    const user = rows[0];
    if (user.status === 'frozen') {
      return res.status(403).json({ success: false, message: 'Akun Anda dibekukan. Hubungi admin.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau kadaluarsa.' });
  }
}

/**
 * Verifikasi JWT token admin
 */
async function authAdmin(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token admin tidak ditemukan.' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Akses ditolak. Bukan admin.' });
    }

    const [rows] = await db.query('SELECT id, username, email, full_name, role, status FROM admins WHERE id = ?', [decoded.id]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Admin tidak ditemukan.' });
    }
    if (rows[0].status !== 'active') {
      return res.status(403).json({ success: false, message: 'Akun admin nonaktif.' });
    }
    req.admin = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token admin tidak valid atau kadaluarsa.' });
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
        const [rows] = await db.query('SELECT id, full_name, email, phone, status FROM users WHERE id = ?', [decoded.id]);
        if (rows.length > 0 && rows[0].status !== 'frozen') req.user = rows[0];
      }
    }
  } catch (e) {
    // ignore
  }
  next();
}

module.exports = { authUser, authAdmin, optionalAuth, JWT_SECRET };