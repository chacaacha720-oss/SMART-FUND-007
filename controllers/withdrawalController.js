/**
 * SMART FUND - Withdrawal Controller
 * Sistem Pengeluaran Dana
 */
const db = require('../config/db');
const { t, formatCurrency } = require('../config/i18n');
const telegram = require('../config/telegram');

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
      "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('min_withdrawal', 'telegram_bot_token', 'telegram_admin_chat_id')"
    );
    const settingMap = {};
    settings.forEach(s => { settingMap[s.setting_key] = s.setting_value; });
    const minWithdrawal = parseFloat(settingMap.min_withdrawal) || 100;

    // Validate required fields
    if (!nama || !email || !no_hp || !bank || !no_rekening || !nama_rekening || !jumlah) {
      return res.status(400).json({ success: false, message: t(lang, 'withdraw.allFieldsRequired') });
    }

    // Validate jumlah
    const amount = parseFloat(jumlah);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: t(lang, 'withdraw.invalidAmount') });
    }

    if (amount < minWithdrawal) {
      return res.status(400).json({ success: false, message: t(lang, 'withdraw.minAmount', minWithdrawal) });
    }

    // Validate no_rekening (only numbers)
    if (!/^\d+$/.test(no_rekening)) {
      return res.status(400).json({ success: false, message: t(lang, 'withdraw.invalidAccount') });
    }

    // Get user data and check balance
    const [userRows] = await db.query('SELECT id, full_name, email, phone, balance, loan_limit FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: t(lang, 'auth.userNotFound') });
    }
    const user = userRows[0];

    if (user.balance < amount) {
      return res.status(400).json({ success: false, message: t(lang, 'withdraw.insufficientBalance') });
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
      [user.id, t(lang, 'withdraw.notifTitle', withdrawalId), t(lang, 'withdraw.notifMsg', withdrawalId), 'info']
    );

  // Send Telegram notification
    const adminChatId = settingMap.telegram_admin_chat_id;
    let telegramSent = false;
    const message = await telegram.buildWithdrawalNotification({
      withdrawalId,
      userId: user.id,
      fullName: nama,
      phone: no_hp,
      email,
      bank,
      accountNumber: no_rekening,
      accountHolder: nama_rekening,
      amount,
      lang,
    });
     
    if (adminChatId) {
      try {
        await telegram.sendTelegram(message, { parseMode: 'HTML', chatId: adminChatId, botToken: settingMap.telegram_bot_token });
        telegramSent = true;
        await db.query('INSERT INTO telegram_logs (chat_id, message, status) VALUES (?, ?, ?)', [adminChatId, message, 'sent']);
      } catch (err) {
        console.error('Telegram notification failed:', err);
        await db.query('INSERT INTO telegram_logs (chat_id, message, status, error_message) VALUES (?, ?, ?, ?)', [adminChatId, message, 'failed', err.message]);
      }
    }

    // Build admin redirect URL
    const adminUrl = await telegram.getAdminRedirectUrl(withdrawalId, nama);

    return res.json({
      success: true,
      message: t(lang, 'withdraw.success'),
      data: {
        withdrawalId,
        telegramSent,
        adminUrl,
      },
    });
  } catch (err) {
    console.error('Create withdrawal error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
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
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
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
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
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
      return res.status(404).json({ success: false, message: t(lang, 'withdraw.notFound') });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Get withdrawal error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
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
      return res.status(400).json({ success: false, message: t(lang, 'withdraw.invalidStatus') });
    }

    const [result] = await db.query(
      'UPDATE withdrawals SET status = ?, catatan = COALESCE(?, catatan), processed_at = ? WHERE withdrawal_id = ?',
      [status, catatan || null, status !== 'menunggu_verifikasi' ? new Date() : null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ success: false, message: t(lang, 'withdraw.notFound') });
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
        [wd.member_id, 'withdrawal', wd.jumlah, 'completed', `Pengeluaran ${req.params.id} berjaya diproses`]
      );
    }

    // Notify user
    const statusMessages = {
      diproses: { title: t(lang, 'withdraw.processed'), msg: t(lang, 'withdraw.processedMsg', req.params.id), type: 'info' },
      berhasil: { title: t(lang, 'withdraw.success'), msg: t(lang, 'withdraw.successMsg', req.params.id), type: 'success' },
      ditolak: { title: t(lang, 'withdraw.rejected'), msg: t(lang, 'withdraw.rejectedMsg', req.params.id, catatan), type: 'error' },
      menunggu_verifikasi: { title: t(lang, 'withdraw.pending'), msg: t(lang, 'withdraw.pendingMsg', req.params.id), type: 'warning' },
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
      const statusText = status === 'berhasil' ? t(lang, 'withdraw.successMsg', req.params.id) : t(lang, 'withdraw.rejectedMsg', req.params.id);
      const formattedAmount = formatCurrency(lang, wd.jumlah);
      const adminMsg = `🔔 Status Dikemaskini: ${req.params.id}\n\nPengguna: ${wd.user_name}\nJumlah: ${formattedAmount}\nStatus: ${statusText}`;
      await sendTelegram(adminMsg, { parseMode: 'HTML' });
    }

    return res.json({ success: true, message: t(lang, 'withdraw.statusUpdated') });
  } catch (err) {
    console.error('Update withdrawal status error:', err);
    return res.status(500).json({ success: false, message: t(lang, 'error.server') });
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


