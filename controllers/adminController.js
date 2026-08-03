/**
 * SMART FUND - Admin Controller
 * Dashboard, manajemen user, pinjaman, transaksi, settings, telegram
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const { sendTelegram } = require('../config/telegram');
const { sanitize } = require('../middleware/validate');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ============================================
// ADMIN AUTH
// ============================================

/**
 * POST /api/admin/auth/login
 */
async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });

    const [rows] = await db.query('SELECT * FROM admins WHERE username = ? OR email = ? LIMIT 1', [username, username]);
    if (rows.length === 0) return res.status(401).json({ success: false, message: 'Username atau password salah' });

    const admin = rows[0];
    if (admin.status !== 'active') return res.status(403).json({ success: false, message: 'Akun admin nonaktif' });

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Username atau password salah' });

    await db.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

    const token = jwt.sign({ id: admin.id, role: admin.role, username: admin.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.json({
      success: true,
      message: 'Login admin berhasil',
      token,
      data: { id: admin.id, username: admin.username, email: admin.email, full_name: admin.full_name, role: admin.role },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * GET /api/admin/me
 */
async function adminMe(req, res) {
  return res.json({ success: true, data: req.admin });
}

// ============================================
// DASHBOARD
// ============================================

/**
 * GET /api/admin/dashboard
 * Statistik dashboard admin
 */
async function adminDashboard(req, res) {
  try {
    const [[totalUser]] = await db.query('SELECT COUNT(*) as cnt FROM users');
    const [[totalPengajuan]] = await db.query('SELECT COUNT(*) as cnt FROM loan_applications');
    const [[pinjamanAktif]] = await db.query("SELECT COUNT(*) as cnt FROM loan_applications WHERE status IN ('approved','disbursed')");
    const [[danaCair]] = await db.query("SELECT COALESCE(SUM(amount),0) as total FROM loan_applications WHERE status = 'disbursed'");
    const [[pinjamanLunas]] = await db.query("SELECT COUNT(*) as cnt FROM loan_applications WHERE status = 'completed'");
    const [[totalUserActive]] = await db.query("SELECT COUNT(*) as cnt FROM users WHERE status = 'active'");

    // Statistik per bulan (6 bulan terakhir) untuk grafik
    const [chartData] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
             COUNT(*) as total,
             COALESCE(SUM(CASE WHEN status='disbursed' THEN amount ELSE 0 END),0) as dana_cair
      FROM loan_applications
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // Pengajuan terbaru
    const [recentApplications] = await db.query(`
      SELECT la.id, la.amount, la.tenor, la.status, la.created_at, u.full_name, u.phone
      FROM loan_applications la JOIN users u ON la.user_id = u.id
      ORDER BY la.created_at DESC LIMIT 5
    `);

    return res.json({
      success: true,
      data: {
        totalUser: totalUser.cnt,
        totalUserActive: totalUserActive.cnt,
        totalPengajuan: totalPengajuan.cnt,
        pinjamanAktif: pinjamanAktif.cnt,
        danaCair: danaCair.total,
        pinjamanLunas: pinjamanLunas.cnt,
        chartData,
        recentApplications,
      },
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

// ============================================
// MANAJEMEN USER
// ============================================

/**
 * GET /api/admin/users
 */
async function listUsers(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, nik, address, job, income_range, balance, loan_limit, status, ktp_filename, created_at, last_login
       FROM users ORDER BY created_at DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * GET /api/admin/users/:id
 */
async function getUser(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, nik, address, job, income_range, balance, loan_limit, status, ktp_filename, created_at, last_login
       FROM users WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    // Ambil pinjaman & transaksi user
    const [loans] = await db.query('SELECT * FROM loan_applications WHERE user_id = ? ORDER BY created_at DESC', [req.params.id]);
    const [transactions] = await db.query('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC', [req.params.id]);

    return res.json({ success: true, data: { ...rows[0], loans, transactions } });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * PUT /api/admin/users/:id
 * Edit user (saldo, limit, status, data)
 */
async function updateUser(req, res) {
  try {
    const { fullName, phone, nik, address, job, incomeRange, balance, loanLimit, status } = req.body;
    const updates = [];
    const params = [];

    if (fullName !== undefined) { updates.push('full_name = ?'); params.push(sanitize(fullName)); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (nik !== undefined) { updates.push('nik = ?'); params.push(sanitize(nik)); }
    if (address !== undefined) { updates.push('address = ?'); params.push(sanitize(address)); }
    if (job !== undefined) { updates.push('job = ?'); params.push(sanitize(job)); }
    if (incomeRange !== undefined) { updates.push('income_range = ?'); params.push(sanitize(incomeRange)); }
    if (balance !== undefined) { updates.push('balance = ?'); params.push(parseFloat(balance)); }
    if (loanLimit !== undefined) { updates.push('loan_limit = ?'); params.push(parseFloat(loanLimit)); }
    if (status !== undefined) {
      if (!['active', 'frozen', 'pending', 'inactive'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status tidak valid' });
      }
      updates.push('status = ?'); params.push(status);
    }

    if (updates.length === 0) return res.status(400).json({ success: false, message: 'Tidak ada data diubah' });

    params.push(req.params.id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    // Catat transaksi adjustment jika saldo diubah
    if (balance !== undefined) {
      const [userRows] = await db.query('SELECT balance, full_name FROM users WHERE id = ?', [req.params.id]);
      const oldBalance = userRows[0].balance;
      const diff = parseFloat(balance) - parseFloat(oldBalance);
      if (diff !== 0) {
        await db.query(
          `INSERT INTO transactions (user_id, type, amount, status, description, admin_note) VALUES (?, 'admin_adjustment', ?, 'completed', ?, ?)`,
          [req.params.id, Math.abs(diff), `Penyesuaian saldo oleh admin ${req.admin.username}`, diff > 0 ? 'Penambahan' : 'Pengurangan']
        );
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'info')`,
          [req.params.id, 'Saldo Diperbarui', `Saldo Anda telah diperbarui oleh admin menjadi Rp${Number(balance).toLocaleString('id-ID')}`]
        );
      }
    }

    return res.json({ success: true, message: 'User berhasil diperbarui' });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * PUT /api/admin/users/:id/status
 * Ubah status user (active/frozen)
 */
async function updateUserStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['active', 'frozen', 'pending', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }
    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    const label = status === 'frozen' ? 'dibekukan' : status === 'active' ? 'diaktifkan' : 'diubah';
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [req.params.id, 'Status Akun', `Akun Anda telah ${label} oleh admin.`, status === 'frozen' ? 'warning' : 'info']
    );
    return res.json({ success: true, message: `User berhasil ${label}` });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * DELETE /api/admin/users/:id
 */
async function deleteUser(req, res) {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

// ============================================
// MANAJEMEN PINJAMAN
// ============================================

/**
 * GET /api/admin/applications
 */
async function listApplications(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT la.*, u.full_name, u.phone, u.email, u.balance, u.loan_limit, u.status as user_status
      FROM loan_applications la JOIN users u ON la.user_id = u.id
      ORDER BY la.created_at DESC
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('List applications error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * GET /api/admin/applications/:id
 */
async function getApplication(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT la.*, u.full_name, u.phone, u.email, u.nik, u.address, u.job, u.income_range, u.balance, u.loan_limit
      FROM loan_applications la JOIN users u ON la.user_id = u.id
      WHERE la.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Get application error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * PUT /api/admin/applications/:id
 * Edit nominal, tenor, catatan
 */
async function updateApplication(req, res) {
  try {
    const { amount, tenor, adminNote } = req.body;
    const updates = [];
    const params = [];

    if (amount !== undefined) { updates.push('amount = ?'); params.push(parseFloat(amount)); }
    if (tenor !== undefined) { updates.push('tenor = ?'); params.push(parseInt(tenor, 10)); }
    if (adminNote !== undefined) { updates.push('admin_note = ?'); params.push(sanitize(adminNote)); }

    if (updates.length === 0) return res.status(400).json({ success: false, message: 'Tidak ada data diubah' });

    // Recalculate jika amount/tenor berubah
    if (amount !== undefined || tenor !== undefined) {
      const [app] = await db.query('SELECT amount, tenor FROM loan_applications WHERE id = ?', [req.params.id]);
      const amt = amount !== undefined ? parseFloat(amount) : parseFloat(app[0].amount);
      const ten = tenor !== undefined ? parseInt(tenor, 10) : parseInt(app[0].tenor, 10);
      const [settings] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'interest_rate'");
      const rate = settings.length ? parseFloat(settings[0].setting_value) : 5;
      const monthlyRate = rate / 100 / 12;
      const monthlyPayment = amt * (monthlyRate * Math.pow(1 + monthlyRate, ten)) / (Math.pow(1 + monthlyRate, ten) - 1);
      const totalPayment = monthlyPayment * ten;
      const totalInterest = totalPayment - amt;
      updates.push('monthly_payment = ?', 'total_interest = ?', 'total_payment = ?');
      params.push(Math.round(monthlyPayment), Math.round(totalInterest), Math.round(totalPayment));
    }

    params.push(req.params.id);
    await db.query(`UPDATE loan_applications SET ${updates.join(', ')} WHERE id = ?`, params);
    return res.json({ success: true, message: 'Pengajuan berhasil diperbarui' });
  } catch (err) {
    console.error('Update application error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * PUT /api/admin/applications/:id/status
 * Approve / Reject / Disburse
 */
async function updateApplicationStatus(req, res) {
  try {
    const { status, adminNote } = req.body;
    const validStatus = ['pending', 'approved', 'rejected', 'disbursed', 'completed'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const [appRows] = await db.query('SELECT * FROM loan_applications WHERE id = ?', [req.params.id]);
    if (appRows.length === 0) return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    const app = appRows[0];

    if (status === 'approved') {
      await db.query(
        `UPDATE loan_applications SET status = 'approved', approved_at = NOW(), admin_note = ? WHERE id = ?`,
        [adminNote || null, req.params.id]
      );
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'success')`,
        [app.user_id, 'Pinjaman Disetujui', `Pengajuan pinjaman #${app.id} Anda telah disetujui. Dana akan segera dicairkan.`]
      );
    } else if (status === 'rejected') {
      await db.query(
        `UPDATE loan_applications SET status = 'rejected', rejected_at = NOW(), admin_note = ? WHERE id = ?`,
        [adminNote || 'Tidak memenuhi kriteria', req.params.id]
      );
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'error')`,
        [app.user_id, 'Pinjaman Ditolak', `Pengajuan pinjaman #${app.id} ditolak. Alasan: ${adminNote || 'Tidak memenuhi kriteria'}`]
      );
    } else if (status === 'disbursed') {
      // Cairkan dana -> saldo user bertambah
      await db.query(
        `UPDATE loan_applications SET status = 'disbursed', disbursed_at = NOW(), admin_note = ? WHERE id = ?`,
        [adminNote || null, req.params.id]
      );
      await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [app.amount, app.user_id]);
      await db.query(
        `INSERT INTO transactions (user_id, loan_id, type, amount, status, description) VALUES (?, ?, 'disbursement', ?, 'completed', 'Pencairan pinjaman')`,
        [app.user_id, app.id, app.amount]
      );
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'success')`,
        [app.user_id, 'Dana Cair', `Pinjaman #${app.id} sebesar Rp${Number(app.amount).toLocaleString('id-ID')} telah dicairkan ke saldo Anda.`]
      );
    } else if (status === 'completed') {
      await db.query(`UPDATE loan_applications SET status = 'completed' WHERE id = ?`, [req.params.id]);
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'success')`,
        [app.user_id, 'Pinjaman Lunas', `Pinjaman #${app.id} telah lunas. Terima kasih.`]
      );
    } else {
      await db.query(`UPDATE loan_applications SET status = 'pending' WHERE id = ?`, [req.params.id]);
    }

    return res.json({ success: true, message: `Status pengajuan: ${status}` });
  } catch (err) {
    console.error('Update application status error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

// ============================================
// MANAJEMEN TRANSAKSI & WITHDRAW
// ============================================

/**
 * GET /api/admin/transactions
 */
async function listTransactions(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT t.*, u.full_name, u.email FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('List transactions error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * PUT /api/admin/transactions/:id/status
 * Approve / Reject transaksi (withdrawal)
 */
async function updateTransactionStatus(req, res) {
  try {
    const { status, adminNote } = req.body;
    if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const [txRows] = await db.query('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
    if (txRows.length === 0) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    const tx = txRows[0];

    await db.query('UPDATE transactions SET status = ?, admin_note = ? WHERE id = ?', [status, adminNote || null, req.params.id]);

    // Jika withdrawal approved -> kurangi saldo user
    if (tx.type === 'withdrawal' && status === 'approved') {
      await db.query('UPDATE users SET balance = balance - ? WHERE id = ?', [tx.amount, tx.user_id]);
      await db.query('UPDATE transactions SET status = ? WHERE id = ?', ['completed', req.params.id]);
    }

    await db.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [tx.user_id, 'Status Transaksi', `Transaksi #${tx.id} (${tx.type}) status: ${status}.`, status === 'rejected' ? 'warning' : 'info']
    );

    return res.json({ success: true, message: `Status transaksi: ${status}` });
  } catch (err) {
    console.error('Update transaction status error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

// ============================================
// SETTINGS & TELEGRAM
// ============================================

/**
 * GET /api/admin/settings
 */
async function getSettings(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM settings ORDER BY id ASC');
    const settings = {};
    rows.forEach((r) => (settings[r.setting_key] = r.setting_value));
    return res.json({ success: true, data: settings });
  } catch (err) {
    console.error('Get settings error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * PUT /api/admin/settings
 */
async function updateSettings(req, res) {
  try {
    const entries = req.body.settings || req.body;
    for (const [key, value] of Object.entries(entries)) {
      await db.query(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, String(value)]
      );
    }
    return res.json({ success: true, message: 'Pengaturan berhasil disimpan' });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * GET /api/admin/telegram/logs
 */
async function telegramLogs(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM telegram_logs ORDER BY created_at DESC LIMIT 100');
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Telegram logs error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

/**
 * POST /api/admin/telegram/test
 * Test kirim pesan telegram
 */
async function telegramTest(req, res) {
  try {
    const result = await sendTelegram('✅ <b>Test Notifikasi SMART FUND</b>\n\nNotifikasi Telegram berfungsi dengan baik.');
    if (result.success) return res.json({ success: true, message: 'Test telegram berhasil dikirim' });
    return res.status(400).json({
      success: false,
      message: result.message || 'Gagal mengirim test telegram. Periksa konfigurasi bot.',
      error: result.error,
    });
  } catch (err) {
    console.error('Telegram test error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
}

module.exports = {
  adminLogin,
  adminMe,
  adminDashboard,
  listUsers,
  getUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  listApplications,
  getApplication,
  updateApplication,
  updateApplicationStatus,
  listTransactions,
  updateTransactionStatus,
  getSettings,
  updateSettings,
  telegramLogs,
  telegramTest,
};