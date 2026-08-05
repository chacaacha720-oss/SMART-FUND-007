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

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * POST /api/auth/register
 * Registrasi user baru -> auto login
 */
async function register(req, res) {
  try {
    const fullName = sanitize(req.body.fullName);
    const email = (req.body.email || '').toLowerCase().trim();
    const phone = sanitize(req.body.phone || '').trim();
    const password = req.body.password;

    const [emailRows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (emailRows.length) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const [phoneRows] = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (phoneRows.length) {
      return res.status(400).json({ success: false, message: 'Nomor HP sudah terdaftar' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let defaultLimit = 5000000;
    try {
      const [settings] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'default_loan_limit'");
      if (settings.length && settings[0].setting_value !== null && settings[0].setting_value !== '') {
        defaultLimit = parseFloat(settings[0].setting_value) || 5000000;
      }
    } catch (settingErr) {
      console.warn('Register settings fallback used:', settingErr.message);
    }

    const [result] = await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, loan_limit, status) VALUES (?, ?, ?, ?, ?, 'active')`,
      [fullName, email, phone, passwordHash, defaultLimit]
    );

    const userId = result.insertId;

    try {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'success')`,
        [userId, 'Selamat Datang di SMART FUND!', `Halo ${fullName}, akun Anda berhasil dibuat. Nikmati berbagai kemudahan pinjaman online bersama kami.`]
      );
    } catch (notifyErr) {
      console.warn('Register welcome notification skipped:', notifyErr.message);
    }

    const token = signToken({ id: userId, role: 'user', email });
    const [userRows] = await db.query('SELECT id, full_name, email, phone, balance, loan_limit, status FROM users WHERE id = ?', [userId]);

    if (!userRows.length) {
      return res.status(500).json({ success: false, message: 'Registrasi gagal, data user tidak ditemukan setelah insert' });
    }

    return res.json({
      success: true,
      message: 'Registrasi berhasil. Anda otomatis login.',
      token,
      data: userRows[0],
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server. Cek koneksi database atau jalankan npm run db:init.' });
  }
}

/**
 * POST /api/auth/login
 * Login dengan email atau nomor HP
 */
async function login(req, res) {
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
      return res.status(401).json({ success: false, message: 'Email/Nomor HP atau password salah' });
    }

    const user = rows[0];
    if (user.status === 'frozen') {
      return res.status(403).json({ success: false, message: 'Akun Anda dibekukan. Hubungi admin.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Email/Nomor HP atau password salah' });
    }

    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const expiresIn = remember ? '30d' : JWT_EXPIRES_IN;
    const token = jwt.sign({ id: user.id, role: 'user', email: user.email }, JWT_SECRET, { expiresIn });

    return res.json({
      success: true,
      message: 'Login berhasil',
      token,
      data: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        loan_limit: user.loan_limit,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * POST /api/auth/forgot-password
 * Kirim OTP (dummy) ke email/HP
 */
async function forgotPassword(req, res) {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const phone = (req.body.phone || '').trim();

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email atau nomor HP wajib diisi' });
    }

    // Cari user
    let query, params;
    if (email) { query = 'SELECT id, email, phone FROM users WHERE email = ?'; params = [email]; }
    else { query = 'SELECT id, email, phone FROM users WHERE phone = ?'; params = [phone]; }

    const [rows] = await db.query(query, params);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
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
      message: 'OTP telah dikirim ke email & SMS Anda',
      // Untuk demo, kembalikan OTP & token
      debug: { otp, token, email: user.email },
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * POST /api/auth/verify-otp
 * Verifikasi OTP
 */
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email dan OTP wajib diisi' });

    const [rows] = await db.query(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND is_used = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
      [email, otp]
    );
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'OTP tidak valid atau kadaluarsa' });
    }

    return res.json({ success: true, message: 'OTP valid', token: rows[0].token });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * POST /api/auth/reset-password
 * Buat password baru setelah verifikasi OTP
 */
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token dan password baru wajib diisi' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });

    const [rows] = await db.query(
      'SELECT * FROM password_resets WHERE token = ? AND is_used = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
      [token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Token tidak valid atau kadaluarsa' });
    }

    const reset = rows[0];
    const hash = await bcrypt.hash(newPassword, 10);

    await db.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, reset.email]);
    await db.query('UPDATE password_resets SET is_used = 1 WHERE id = ?', [reset.id]);

    return res.json({ success: true, message: 'Password berhasil diubah. Silakan login.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * GET /api/auth/me
 * Data user yang sedang login
 */
async function me(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT id, full_name, email, phone, nik, address, job, income_range, balance, loan_limit, status, ktp_filename, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

module.exports = { register, login, forgotPassword, verifyOtp, resetPassword, me };