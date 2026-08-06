/**
 * SMART FUND - Withdrawal Controller
 * Sistem Penarikan Dana
 */
const db = require('../config/db');
const { sendTelegram } = require('../config/telegram');
const { t } = require('../config/i18n');

/**
 * Generate withdrawal ID: WD-YYYYMMDD-XXXXXX
 */
function generateWithdrawalId() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() + 
    String(now.getMonth() + 1).padStart(2, '0') + 
    String(now.getDate()).padStart(2, '0');
  return `WD-${dateStr}`;
}

/**
 * POST /api/withdrawals
 * Submit withdrawal request
 */
async function createWithdrawal(req, res) {
  const lang = req.lang || 'id';
  try {
    const { nama, email, no_hp, bank, no_rekening, nama_rekening, jumlah, catatan } = req.body;
    const userId = req.user.id;

    // Get settings
    const [settings] = await db.query(
      "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('min_withdrawal', 'telegram_admin_chat_id')"
    );
    const settingMap = {};
    settings.forEach(s => { settingMap[s.setting_key] = s.setting_value; });
    const minWithdrawal = parseFloat(settingMap.min_withdrawal) || 100000;

    // Validate required fields
    if (!nama || !email || !no_hp || !bank || !no_rekening || !nama_rekening || !jumlah) {
      return res.status(400).json({ success: false, message: t(lang, 'withdraw.allFieldsRequired', 'Semua field wajib diisi') });
    }

    // Validate jumlah
    const amount = parseFloat(jumlah);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: t(lang, 'withdraw.invalidAmount', 'Jumlah penarikan harus berupa angka positif') });
    }

    if (amount < minWithdrawal) {
      return res.status(400).json({ success: false, message: t(lang, 'withdraw.minAmount', `Jumlah penarikan minimum adalah Rp${minWithdrawal.toLocaleString()}`) });
    }

    // Validate no_rekening (only numbers)
    if (!/^\d+$/.test(no_rekening)) {
      return res.status(400).json({ success: false, message: t(lang, 'withdraw.invalidAccount', 'Nomor rekening hanya boleh mengandung angka') });
    }

    // Get user data and check balance
    const [userRows] = await db.query('SELECT id, full_name, email, phone, balance, loan_limit FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: t(lang, 'auth.userNotFound', 'Pengguna tidak ditemukan') });
    }
    const user = userRows[0];

    if (user.balance < amount) {
      return res.status(400).json({ success: false, message: t(lang, 'withdraw.insufficientBalance', 'Saldo tidak mencukupi untuk penarikan') });
    }

    // Generate unique withdrawal ID
    let withdrawalId;
    let attempts = 0;
    while (attempts < 100) {
      withdrawalId = generateWithdrawalId() + '-' + String(attempts + 1).padStart(6, '0');
      const [existing] = await db.query('SELECT id FROM withdrawals WHERE withdrawal_id = ?', [withdrawalId]);
      if (existing.length === 0) break;
      attempts++;
    }
    if (attempts >= 100) withdrawalId = generateWithdrawalId() + '-' + Date.now();

    // Insert withdrawal
    const [result] = await db.query(
      `INSERT INTO withdrawals (withdrawal_id, member_id, nama, email, no_hp, bank, no_rekening, nama_rekening, jumlah, catatan, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'menunggu_verifikasi')`,
      [withdrawalId, user.id, nama, email, no_hp, bank, no_rekening, nama_rekening, amount, catatan || null]
    );

    // Create notification for user
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [user.id, t(lang, 'withdraw.notifTitle', 'Penarikan Diajukan'), t(lang, 'withdraw.notifMsg', `Penarikan ${withdrawalId} sedang menunggu verifikasi`), 'info']
    );

    // Send Telegram notification
    const adminChatId = settingMap.telegram_admin_chat_id;
    let telegramSent = false;
    if (adminChatId) {
      const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
      const message = `🔔 <b>PENARIKAN BARU</b>\n\n` +
        `ID Penarikan:\n<b>${withdrawalId}</b>\n\n` +
        `ID Member:\n${user.id}\n\n` +
        `Nama:\n${nama}\n\n` +
        `No HP:\n${no_hp}\n\n` +
        `Email:\n${email}\n\n` +
        `Bank:\n${bank}\n\n` +
        `Nomor Rekening:\n${no_rekening}\n\n` +
        `Nama Rekening:\n${nama_rekening}\n\n` +
        `Jumlah:\n${formattedAmount}\n\n` +
        `Tanggal:\n${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', timeZoneName: 'short' })}\n\n` +
        `Status:\nMenunggu Verifikasi`;
      
      try {
        await sendTelegram(message, { parseMode: 'HTML', chatId: adminChatId });
        telegramSent = true;
        // Log telegram message
        await db.query(
          'INSERT INTO telegram_logs (chat_id, message, status) VALUES (?, ?, ?)',
          [adminChatId, message, 'sent']
        );
      } catch (err) {
        console.error('Telegram notification failed:', err);
        await db.query(
          'INSERT INTO telegram_logs (chat_id, message, status, error_message) VALUES (?, ?, ?, ?)',
          [adminChatId, message, 'failed', err.message]
        );
      }
    }

    return res.json({
      success: true,
      message: t(lang, 'withdraw.success', 'Penarikan berhasil diajukan'),
      data: {
        withdrawalId,
        telegramSent,
        whatsappUrl: `https://t.me/${settingMap.telegram_bot_username || 'smartfundx_bot'}?start=withdraw_${withdrawalId}`,
      },
    });
  } catch (err) {
    console.error('Create withdrawal error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server', 'Terjadi kesalahan server') });
  }
}

/**
 * GET /api/withdrawals
 * List all withdrawals for admin
 */
async function listWithdrawals(req, res) {
  const lang = req.lang || 'id';
  try {
    const { status, search, dateFrom, dateTo } = req.query;
    let where = [];
    let params = [];

    if (status) {
      where.push('w.status = ?');
      params.push(status);
    }
    if (search) {
      where.push('(w.nama LIKE ? OR w.email LIKE ? OR w.withdrawal_id LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (dateFrom) {
      where.push('DATE(w.created_at) >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      where.push('DATE(w.created_at) <= ?');
      params.push(dateTo);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await db.query(
      `SELECT w.*, u.full_name as user_name, u.email as user_email 
       FROM withdrawals w 
       LEFT JOIN users u ON w.member_id = u.id 
       ${whereClause}
       ORDER BY w.created_at DESC`,
      params
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('List withdrawals error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server', 'Terjadi kesalahan server') });
  }
}

/**
 * GET /api/withdrawals/user
 * Get current user's withdrawals
 */
async function getUserWithdrawals(req, res) {
  const lang = req.lang || 'id';
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      'SELECT * FROM withdrawals WHERE member_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get user withdrawals error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server', 'Terjadi kesalahan server') });
  }
}

/**
 * GET /api/withdrawals/:id
 * Get single withdrawal detail
 */
async function getWithdrawal(req, res) {
  const lang = req.lang || 'id';
  try {
    const [rows] = await db.query(
      `SELECT w.*, u.full_name as user_name, u.email as user_email 
       FROM withdrawals w 
       LEFT JOIN users u ON w.member_id = u.id 
       WHERE w.withdrawal_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: t(lang, 'withdraw.notFound', 'Penarikan tidak ditemukan') });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Get withdrawal error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server', 'Terjadi kesalahan server') });
  }
}

/**
 * PUT /api/withdrawals/:id/status
 * Update withdrawal status
 */
async function updateWithdrawalStatus(req, res) {
  const lang = req.lang || 'id';
  try {
    const { status, catatan } = req.body;
    const validStatuses = ['menunggu_verifikasi', 'diproses', 'berhasil', 'ditolak'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: t(lang, 'withdraw.invalidStatus', 'Status tidak valid') });
    }

    const [result] = await db.query(
      'UPDATE withdrawals SET status = ?, catatan = COALESCE(?, catatan), processed_at = ? WHERE withdrawal_id = ?',
      [status, catatan || null, status !== 'menunggu_verifikasi' ? new Date() : null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: t(lang, 'withdraw.notFound', 'Penarikan tidak ditemukan') });
    }

    // Get withdrawal data for notification
    const [wdRows] = await db.query(
      'SELECT w.*, u.email as user_email, u.full_name as user_name FROM withdrawals w LEFT JOIN users u ON w.member_id = u.id WHERE w.withdrawal_id = ?',
      [req.params.id]
    );
    const wd = wdRows[0];

    // If approved, deduct balance and create transaction
    if (status === 'berhasil') {
      await db.query('UPDATE users SET balance = balance - ? WHERE id = ?', [wd.jumlah, wd.member_id]);
      await db.query(
        'INSERT INTO transactions (user_id, type, amount, status, description) VALUES (?, ?, ?, ?, ?)',
        [wd.member_id, 'withdrawal', wd.jumlah, 'completed', `Penarikan ${req.params.id} berhasil diproses`]
      );
    }

    // Notify user
    const statusMessages = {
      diproses: { title: t(lang, 'withdraw.processed', 'Diproses'), msg: t(lang, 'withdraw.processedMsg', `Penarikan ${req.params.id} sedang diproses`), type: 'info' },
      berhasil: { title: t(lang, 'withdraw.success', 'Berhasil'), msg: t(lang, 'withdraw.successMsg', `Penarikan ${req.params.id} berhasil diproses`), type: 'success' },
      ditolak: { title: t(lang, 'withdraw.rejected', 'Ditolak'), msg: t(lang, 'withdraw.rejectedMsg', `Penarikan ${req.params.id} ditolak. ${catatan || ''}`), type: 'error' },
      menunggu_verifikasi: { title: t(lang, 'withdraw.pending', 'Menunggu Verifikasi'), msg: t(lang, 'withdraw.pendingMsg', `Penarikan ${req.params.id} menunggu verifikasi`), type: 'warning' },
    };
    const notif = statusMessages[status];
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [wd.member_id, notif.title, notif.msg, notif.type]
    );

    // Update dashboard user
    if (typeof global.AdminSync !== 'undefined' && global.AdminSync.notifyDataChanged) {
      global.AdminSync.notifyDataChanged();
    }

    // Send Telegram notification for important status changes
    if (status === 'berhasil' || status === 'ditolak') {
      const statusText = status === 'berhasil' ? '✅ Berhasil' : '❌ Ditolak';
      const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(wd.jumlah);
      const adminMsg = `🔄 Status Update: ${req.params.id}\n\nUser: ${wd.user_name}\nJumlah: ${formattedAmount}\nStatus: ${statusText}`;
      await sendTelegram(adminMsg, { parseMode: 'HTML' });
    }

    return res.json({ success: true, message: t(lang, 'withdraw.statusUpdated', 'Status penarikan berhasil diperbarui') });
  } catch (err) {
    console.error('Update withdrawal status error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server', 'Terjadi kesalahan server') });
  }
}

module.exports = {
  generateWithdrawalId,
  createWithdrawal,
  listWithdrawals,
  getUserWithdrawals,
  getWithdrawal,
  updateWithdrawalStatus,
};