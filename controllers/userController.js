/**
 * SMART FUND - User Controller
 * Dashboard, profil, transaksi, notifikasi, upload dokumen
 */
const db = require('../config/db');
const { sendTelegram } = require('../config/telegram');
const { sanitize, normalizePhone } = require('../middleware/validate');
const { t, formatCurrencyMYR, formatDate, formatDateTime } = require('../config/i18n');

/**
 * GET /api/user/dashboard
 * Ringkasan dashboard user
 */
async function dashboard(req, res) {
  const lang = req.lang || 'ms';
  try {
    const userId = req.user.id;

    // Data user
    const [userRows] = await db.query(
      'SELECT u.id, u.full_name, u.email, u.phone, u.balance, u.loan_limit, u.status, u.created_at, u.cs_id, a.cs_code as cs_kode, a.full_name as cs_name FROM users u LEFT JOIN admins a ON u.cs_id = a.id WHERE u.id = ?',
      [userId]
    );
    if (userRows.length === 0) return res.status(404).json({ success: false, message: t(lang, 'user.notFound') });
    const user = userRows[0];

    // Total tagihan (pinjaman aktif yang harus dibayar)
    const [tagihanRows] = await db.query(
      `SELECT COALESCE(SUM(total_payment),0) as total_tagihan
       FROM loan_applications WHERE user_id = ? AND status IN ('disbursed')`,
      [userId]
    );
    const totalTagihan = tagihanRows[0].total_tagihan;

    // Status pengajuan terakhir
    const [lastApp] = await db.query(
      `SELECT id, amount, status, created_at FROM loan_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    // Riwayat transaksi (5 terakhir)
    const [transactions] = await db.query(
      `SELECT id, type, amount, status, description, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );

    // Notifikasi belum dibaca
    const [unreadNotif] = await db.query(
      'SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    return res.json({
      success: true,
      data: {
        user,
        saldoPinjaman: user.balance,
        limitPinjaman: user.loan_limit,
        totalTagihan,
        statusAkun: user.status,
        statusPengajuan: lastApp.length ? lastApp[0] : null,
        riwayatTransaksi: transactions,
        unreadNotifications: unreadNotif[0].cnt,
        cs_code: user.cs_kode,
        cs_name: user.cs_name,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

/**
 * GET /api/user/transactions
 * Semua transaksi user
 */
async function createWithdrawal(req, res) {
  const lang = req.lang || 'ms';
  try {
    const amount = Number(req.body.amount);
    const bankName = sanitize((req.body.bankName || '').trim());
    const accountHolder = sanitize((req.body.accountHolder || '').trim());
    const accountNumber = sanitize((req.body.accountNumber || '').trim());

    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: t(lang, 'user.minWithdraw') });
    }
    if (!bankName || !accountHolder || !accountNumber) {
      return res.status(400).json({ success: false, message: t(lang, 'user.withdrawDataRequired') });
    }

    const [userRows] = await db.query(
      'SELECT u.id, u.full_name, u.balance, u.status, a.cs_code, a.full_name as cs_name FROM users u LEFT JOIN admins a ON u.cs_id = a.id WHERE u.id = ?',
      [req.user.id]
    );
    if (userRows.length === 0) return res.status(404).json({ success: false, message: t(lang, 'user.notFound') });

    const user = userRows[0];
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: t(lang, 'user.notActiveWithdraw') });
    }
    if (amount > Number(user.balance)) {
      return res.status(400).json({ success: false, message: t(lang, 'user.exceedBalance') });
    }

    const withdrawalPayload = {
      bankName,
      accountHolder,
      accountNumber,
    };

    await db.query(
      `INSERT INTO transactions (user_id, type, amount, status, description, admin_note)
       VALUES (?, 'withdrawal', ?, 'pending', ?, ?)
      `,
      [
        req.user.id,
        amount,
        t(lang, 'user.withdrawDesc', bankName),
        JSON.stringify(withdrawalPayload),
      ]
    );

    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, 'info')`,
      [
        req.user.id,
        t(lang, 'user.withdrawNotifTitle'),
        t(lang, 'user.withdrawNotifMsg', amount),
      ]
    );

     const csLine = user.cs_code
       ? `\n👨\u200d💼 <b>${t(lang, 'telegram.csData', 'Data CS')}:</b>\n• ${t(lang, 'telegram.csCode', 'Kod CS')}: ${user.cs_code}\n• ${t(lang, 'telegram.csName', 'Nama CS')}: ${user.cs_name || '-'}`.trim()
       : `\n👨\u200d💼 <b>${t(lang, 'telegram.csData', 'Data CS')}:</b>\n• ${t(lang, 'telegram.csCode', 'Kod CS')}: -`.trim();

     const withdrawalMessage = `
🔔 <b>${t(lang, 'user.withdrawNotifTitle')}</b>

👤 <b>Data Peminjam:</b>
Jumlah Pengeluaran: ${formatCurrencyMYR(amount)}
Nama Bank Tujuan: ${bankName}
Atas Nama: ${accountHolder}
Nombor Akaun: ${accountNumber}${csLine}

⏰ ${formatDateTime(lang, new Date().toISOString())}
     `.trim();

    try {
      await sendTelegram(withdrawalMessage, { parseMode: 'HTML' });
    } catch (telegramError) {
      console.error('Withdrawal Telegram notification error:', telegramError.message || telegramError);
    }

    return res.json({
      success: true,
      message: t(lang, 'user.withdrawSuccess'),
    });
  } catch (err) {
    console.error('Create withdrawal error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

async function transactions(req, res) {
  const lang = req.lang || 'ms';
  try {
    const [rows] = await db.query(
      `SELECT id, loan_id, type, amount, status, description, admin_note, created_at
       FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Transactions error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

/**
 * GET /api/user/notifications
 * Notifikasi user
 */
async function notifications(req, res) {
  const lang = req.lang || 'ms';
  try {
    const [rows] = await db.query(
      `SELECT id, title, message, type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Notifications error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

/**
 * PUT /api/user/notifications/:id/read
 * Tandai notifikasi dibaca
 */
async function readNotification(req, res) {
  const lang = req.lang || 'ms';
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ success: true, message: t(lang, 'user.notifRead') });
  } catch (err) {
    console.error('Read notification error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

/**
 * PUT /api/user/profile
 * Update profil user
 */
async function updateProfile(req, res) {
  const lang = req.lang || 'ms';
  try {
    const { fullName, phone, nik, address, job, incomeRange } = req.body;
    const updates = [];
    const params = [];

    if (fullName) { updates.push('full_name = ?'); params.push(sanitize(fullName)); }
    if (phone) {
      const norm = normalizePhone(phone);
      if (!norm) return res.status(400).json({ success: false, message: t(lang, 'val.phoneInvalid') });
      updates.push('phone = ?');
      params.push(norm);
    }
    if (nik) { updates.push('nik = ?'); params.push(sanitize(nik)); }
    if (address) { updates.push('address = ?'); params.push(sanitize(address)); }
    if (job) { updates.push('job = ?'); params.push(sanitize(job)); }
    if (incomeRange) { updates.push('income_range = ?'); params.push(sanitize(incomeRange)); }

    if (updates.length === 0) return res.status(400).json({ success: false, message: t(lang, 'user.noDataChanged') });

    params.push(req.user.id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    return res.json({ success: true, message: t(lang, 'user.profileUpdated') });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

/**
 * PUT /api/user/settings
 * Pengaturan akun (ganti password)
 */
async function updateSettings(req, res) {
  const lang = req.lang || 'ms';
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: t(lang, 'user.passwordRequired') });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: t(lang, 'user.newPasswordMin') });
    }

    const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const bcrypt = require('bcrypt');
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ success: false, message: t(lang, 'user.oldPasswordWrong') });

    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);

    return res.json({ success: true, message: t(lang, 'user.passwordChanged') });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

/**
 * POST /api/user/upload-document
 * Upload KTP / dokumen
 */
async function uploadDocument(req, res) {
  const lang = req.lang || 'ms';
  try {
    if (!req.file) return res.status(400).json({ success: false, message: t(lang, 'user.fileNotFound') });
    await db.query('UPDATE users SET ktp_filename = ? WHERE id = ?', [req.file.filename, req.user.id]);
    return res.json({ success: true, message: t(lang, 'user.docUploaded'), data: { filename: req.file.filename } });
  } catch (err) {
    console.error('Upload document error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}

module.exports = {
  dashboard,
  createWithdrawal,
  transactions,
  notifications,
  readNotification,
  updateProfile,
  updateSettings,
  uploadDocument,
  registerFcmToken,
};

/**
 * POST /api/user/fcm/register
 * Simpan FCM device token untuk push notification (Android APK)
 */
async function registerFcmToken(req, res) {
  const lang = req.lang || 'ms';
  try {
    const token = (req.body.token || '').trim();
    if (!token) return res.status(400).json({ success: false, message: 'token required' });
    await db.query('UPDATE users SET fcm_token = ? WHERE id = ?', [token, req.user.id]);
    return res.json({ success: true, message: 'FCM token registered' });
  } catch (err) {
    console.error('Register FCM token error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
  }
}