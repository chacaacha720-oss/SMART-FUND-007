/**
 * SMART FUND - User Controller
 * Dashboard, profil, transaksi, notifikasi, upload dokumen
 */
const db = require('../config/db');
const { sendTelegram } = require('../config/telegram');
const { sanitize } = require('../middleware/validate');

/**
 * GET /api/user/dashboard
 * Ringkasan dashboard user
 */
async function dashboard(req, res) {
  try {
    const userId = req.user.id;

    // Data user
    const [userRows] = await db.query(
      'SELECT id, full_name, email, phone, balance, loan_limit, status, created_at FROM users WHERE id = ?',
      [userId]
    );
    if (userRows.length === 0) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
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
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * GET /api/user/transactions
 * Semua transaksi user
 */
async function createWithdrawal(req, res) {
  try {
    const amount = Number(req.body.amount);
    const bankName = sanitize((req.body.bankName || '').trim());
    const accountHolder = sanitize((req.body.accountHolder || '').trim());
    const accountNumber = sanitize((req.body.accountNumber || '').trim());

    if (!amount || amount < 100000) {
      return res.status(400).json({ success: false, message: 'Nominal penarikan minimal Rp 100.000' });
    }
    if (!bankName || !accountHolder || !accountNumber) {
      return res.status(400).json({ success: false, message: 'Semua data akaun tujuan diperlukan' });
    }

    const [userRows] = await db.query('SELECT id, full_name, balance, status FROM users WHERE id = ?', [req.user.id]);
    if (userRows.length === 0) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    const user = userRows[0];
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Akun Anda belum aktif untuk melakukan penarikan' });
    }
    if (amount > Number(user.balance)) {
      return res.status(400).json({ success: false, message: 'Nominal penarikan melebihi saldo yang tersedia' });
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
        `Permintaan penarikan ke ${bankName}`,
        JSON.stringify(withdrawalPayload),
      ]
    );

    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, 'info')`,
      [
        req.user.id,
        'Permintaan Penarikan Diterima',
        `Permintaan penarikan sebesar Rp${Number(amount).toLocaleString('id-ID')} sedang menunggu verifikasi admin.`,
      ]
    );

    const withdrawalMessage = `
🔔 <b>PENGAJUAN PENARIKAN BARU</b>

👤 <b>Data Peminjam:</b>
Nominal Penarikan: ${Number(amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
Nama Bank Tujuan: ${bankName}
Atas Nama: ${accountHolder}
  Nombor Akaun: ${accountNumber}

⏰ Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
    `.trim();

    try {
      await sendTelegram(withdrawalMessage, { parseMode: 'HTML' });
    } catch (telegramError) {
      console.error('Withdrawal Telegram notification error:', telegramError.message || telegramError);
    }

    return res.json({
      success: true,
      message: 'Permintaan penarikan berhasil dikirim. Silakan lakukan verifikasi KYC melalui admin.',
    });
  } catch (err) {
    console.error('Create withdrawal error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

async function transactions(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT id, loan_id, type, amount, status, description, admin_note, created_at
       FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Transactions error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * GET /api/user/notifications
 * Notifikasi user
 */
async function notifications(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT id, title, message, type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Notifications error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * PUT /api/user/notifications/:id/read
 * Tandai notifikasi dibaca
 */
async function readNotification(req, res) {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ success: true, message: 'Notifikasi dibaca' });
  } catch (err) {
    console.error('Read notification error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * PUT /api/user/profile
 * Update profil user
 */
async function updateProfile(req, res) {
  try {
    const { fullName, phone, nik, address, job, incomeRange } = req.body;
    const updates = [];
    const params = [];

    if (fullName) { updates.push('full_name = ?'); params.push(sanitize(fullName)); }
    if (phone) { updates.push('phone = ?'); params.push(phone.trim()); }
    if (nik) { updates.push('nik = ?'); params.push(sanitize(nik)); }
    if (address) { updates.push('address = ?'); params.push(sanitize(address)); }
    if (job) { updates.push('job = ?'); params.push(sanitize(job)); }
    if (incomeRange) { updates.push('income_range = ?'); params.push(sanitize(incomeRange)); }

    if (updates.length === 0) return res.status(400).json({ success: false, message: 'Tidak ada data yang diubah' });

    params.push(req.user.id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    return res.json({ success: true, message: 'Profil berjaya dikemas kini' });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * PUT /api/user/settings
 * Pengaturan akun (ganti password)
 */
async function updateSettings(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Kata laluan lama dan baru diperlukan' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
    }

    const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const bcrypt = require('bcrypt');
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Password lama salah' });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);

    return res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * POST /api/user/upload-document
 * Upload KTP / dokumen
 */
async function uploadDocument(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    await db.query('UPDATE users SET ktp_filename = ? WHERE id = ?', [req.file.filename, req.user.id]);
    return res.json({ success: true, message: 'Dokumen berhasil diupload', data: { filename: req.file.filename } });
  } catch (err) {
    console.error('Upload document error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
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
};