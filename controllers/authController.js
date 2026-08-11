/**
 * SMART FUND - Auth Controller
 * Registrasi, Login, Forgot Password, OTP (dummy)
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const { sanitize, isValidEmail } = require('../middleware/validate');
const { t } = require('../config/i18n');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * POST /api/auth/register
 * Registrasi user baru -> auto login
 */
async function register(req, res) {
  const lang = req.lang || 'id';
  try {
    const fullName = sanitize(req.body.fullName);
    const email = (req.body.email || '').toLowerCase().trim();
    const phone = sanitize(req.body.phone || '').trim();
    const password = req.body.password;
    const csCode = (req.body.csCode || '').trim();

    // Validate CS code
    if (!csCode || !/^CS\d{2}$/.test(csCode)) {
      return res.status(400).json({ success: false, message: t(lang, 'auth.csCodeInvalid') });
    }

    const [csRows] = await db.query('SELECT id, cs_code, full_name FROM admins WHERE cs_code = ?', [csCode]);
    if (csRows.length === 0) {
      return res.status(400).json({ success: false, message: t(lang, 'auth.csCodeNotFound') });
    }
    if (csRows[0].status !== 'active') {
      return res.status(403).json({ success: false, message: t(lang, 'auth.csInactive') });
    }
    const csId = csRows[0].id;

    // Cek email sudah terdaftar
    const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) {
      return res.status(400).json({ success: false, message: t(lang, 'auth.emailExists') });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Ambil default loan limit dari settings
    const [settings] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'default_loan_limit'");
    const defaultLimit = settings.length ? parseFloat(settings[0].setting_value) : 200000000;

    const [result] = await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, loan_limit, status, cs_id) VALUES (?, ?, ?, ?, ?, 'active', ?)`,
      [fullName, email, phone, passwordHash, defaultLimit, csId]
    );

    const userId = result.insertId;

    // Buat notifikasi welcome
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'success')`,
      [userId, t(lang, 'auth.welcomeNotif'), t(lang, 'auth.welcomeMsg', fullName)]
    );

    // Auto login
    const token = signToken({ id: userId, role: 'user', email });
    const [userRows] = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.balance, u.loan_limit, u.status, u.cs_id,
              a.cs_code
       FROM users u LEFT JOIN admins a ON u.cs_id = a.id
       WHERE u.id = ?`,
      [userId]
    );

    return res.json({
      success: true,
      message: t(lang, 'auth.registerSuccess'),
      token,
      data: userRows[0],
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

/**
 * POST /api/auth/login
 * Login dengan email atau nomor HP
 */
async function login(req, res) {
  const lang = req.lang || 'id';
  try {
    const identifier = (req.body.identifier || '').trim();
    const password = req.body.password;
    const remember = req.body.remember;

    // Cari user berdasarkan email atau phone
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1',
      [identifier, identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: t(lang, 'auth.loginFailed') });
    }

    const user = rows[0];
    if (user.status === 'frozen') {
      return res.status(403).json({ success: false, message: t(lang, 'auth.accountFrozenLogin') });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: t(lang, 'auth.loginFailed') });
    }

    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const expiresIn = remember ? '30d' : JWT_EXPIRES_IN;
    const token = jwt.sign({ id: user.id, role: 'user', email: user.email }, JWT_SECRET, { expiresIn });

    // Fetch cs_code for the user
    let csCode = null;
    if (user.cs_id) {
      const [csRows] = await db.query('SELECT cs_code FROM admins WHERE id = ?', [user.cs_id]);
      if (csRows.length) csCode = csRows[0].cs_code;
    }

    return res.json({
      success: true,
      message: t(lang, 'auth.loginSuccess'),
      token,
      data: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        loan_limit: user.loan_limit,
        status: user.status,
        cs_code: csCode,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

/**
 * POST /api/auth/forgot-password
 * Kirim OTP (dummy) ke email/HP
 */
async function forgotPassword(req, res) {
  const lang = req.lang || 'id';
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const phone = (req.body.phone || '').trim();

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: t(lang, 'auth.identifierRequired') });
    }

    // Cari user
    let query, params;
    if (email) { query = 'SELECT id, email, phone FROM users WHERE email = ?'; params = [email]; }
    else { query = 'SELECT id, email, phone FROM users WHERE phone = ?'; params = [phone]; }

    const [rows] = await db.query(query, params);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: t(lang, 'auth.accountNotFound') });
    }

    const user = rows[0];
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

    await db.query(
      `INSERT INTO password_resets (email, token, otp, expires_at) VALUES (?, ?, ?, ?)`,
      [user.email, token, otp, expiresAt]
    );

    // Dummy OTP - di production kirim via email/SMS gateway
    console.log(`[OTP DUMMY] Reset password untuk ${user.email}: OTP=${otp}`);

    return res.json({
      success: true,
      message: t(lang, 'auth.otpSent'),
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

/**
 * POST /api/auth/verify-otp
 * Verifikasi OTP
 */
async function verifyOtp(req, res) {
  const lang = req.lang || 'id';
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: t(lang, 'auth.emailOtpRequired') });

    const [rows] = await db.query(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND is_used = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
      [email, otp]
    );
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: t(lang, 'auth.otpInvalid') });
    }

    return res.json({ success: true, message: t(lang, 'auth.otpValid'), token: rows[0].token });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

/**
 * POST /api/auth/reset-password
 * Buat password baru setelah verifikasi OTP
 */
async function resetPassword(req, res) {
  const lang = req.lang || 'id';
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: t(lang, 'auth.tokenPasswordRequired') });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: t(lang, 'auth.passwordMin') });

    const [rows] = await db.query(
      'SELECT * FROM password_resets WHERE token = ? AND is_used = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
      [token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: t(lang, 'auth.resetTokenInvalid') });
    }

    const reset = rows[0];
    const hash = await bcrypt.hash(newPassword, 12);

    await db.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, reset.email]);
    await db.query('UPDATE password_resets SET is_used = 1 WHERE id = ?', [reset.id]);

    return res.json({ success: true, message: t(lang, 'auth.passwordChanged') });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

/**
 * GET /api/auth/me
 * Data user yang sedang login
 */
async function me(req, res) {
  const lang = req.lang || 'id';
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.nik, u.address, u.job, u.income_range,
              u.balance, u.loan_limit, u.status, u.ktp_filename, u.created_at,
              a.cs_code, a.full_name as cs_name
       FROM users u LEFT JOIN admins a ON u.cs_id = a.id WHERE u.id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: t(lang, 'auth.userNotFound404') });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

module.exports = { register, login, forgotPassword, verifyOtp, resetPassword, me };