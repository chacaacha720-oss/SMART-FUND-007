/**
 * SMART FUND - Telegram Bot Notification Service
 * Mengirim notifikasi pengajuan pinjaman ke admin via Telegram Bot API
 */
require('dotenv').config();
const axios = require('axios');
const db = require('./db');

const DEFAULT_TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const DEFAULT_TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '';
const DEFAULT_TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'smartfundonline_bot';
const KYC_MESSAGE = `Verifikasi / KYC belum aktif lakukan verifikasi\n\nUntuk melanjutkan penarikan`;

async function getTelegramSettings() {
  try {
    const [rows] = await db.query(
      `SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('telegram_bot_token', 'telegram_admin_chat_id', 'telegram_bot_username')`
    );
    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    return {
      botToken: settings.telegram_bot_token || DEFAULT_TELEGRAM_BOT_TOKEN,
      adminChatId: settings.telegram_admin_chat_id || DEFAULT_TELEGRAM_ADMIN_CHAT_ID,
      botUsername: settings.telegram_bot_username || DEFAULT_TELEGRAM_BOT_USERNAME,
    };
  } catch (err) {
    return {
      botToken: DEFAULT_TELEGRAM_BOT_TOKEN,
      adminChatId: DEFAULT_TELEGRAM_ADMIN_CHAT_ID,
      botUsername: DEFAULT_TELEGRAM_BOT_USERNAME,
    };
  }
}

/**
 * Kirim pesan ke Telegram admin
 * @param {string} message - Pesan (HTML parse mode)
 * @param {object} options - { chatId, parseMode, inlineKeyboard }
 */
async function sendTelegram(message, options = {}) {
  const config = await getTelegramSettings();
  const botToken = config.botToken;
  const chatId = options.chatId || config.adminChatId;
  const parseMode = options.parseMode || 'HTML';

  if (!botToken || !chatId || botToken === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    const details = 'Bot token / chat id belum dikonfigurasi atau masih menggunakan placeholder.';
    console.warn('[Telegram] Bot token / chat id belum dikonfigurasi. Pesan tidak terkirim.');
    await logTelegram(null, message, 'failed', details);
    return { success: false, error: 'not_configured', message: details };
  }

  const payload = {
    chat_id: chatId,
    text: message,
    parse_mode: parseMode,
    disable_web_page_preview: true,
  };

  if (options.inlineKeyboard) {
    payload.reply_markup = JSON.stringify({
      inline_keyboard: options.inlineKeyboard,
    });
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const { data } = await axios.post(url, payload, { timeout: 10000 });

    if (data.ok) {
      await logTelegram(chatId, message, 'sent', null, payload);
      console.log('[Telegram] Notification sent to admin');
      return { success: true, data };
    }
    const errMsg = 'Telegram API mengembalikan response yang tidak valid.';
    await logTelegram(chatId, message, 'failed', errMsg, payload);
    return { success: false, error: 'unknown', message: errMsg };
  } catch (err) {
    const details = err.response && err.response.data && err.response.data.description
      ? err.response.data.description
      : err.message;
    const errMsg = JSON.stringify(err.response ? err.response.data : { message: err.message });
    console.error('[Telegram] Error sending:', errMsg);
    await logTelegram(chatId, message, 'failed', details, payload);
    return { success: false, error: details, message: details };
  }
}

/**
 * Simpan log telegram ke database
 */
async function logTelegram(chatId, message, status, error, payload) {
  try {
    await db.query(
      `INSERT INTO telegram_logs (chat_id, message, status, error_message, payload) VALUES (?, ?, ?, ?, ?)`,
      [chatId, message, status, error, payload ? JSON.stringify(payload) : null]
    );
  } catch (e) {
    console.error('[Telegram] Failed to log:', e.message);
  }
}

/**
 * Format notifikasi pengajuan pinjaman baru
 */
async function buildLoanApplicationMessage(data) {
  const {
    fullName, phone, email, amount, tenor, purpose,
    monthlyPayment, totalInterest, totalPayment, applicationId, userId,
  } = data;

  const fmt = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');
  const date = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  const config = await getTelegramSettings();
  const dashboardUrl = `${process.env.SITE_URL || 'http://localhost:3000'}/admin.html#applications`;
  const chatUrl = `https://t.me/${config.botUsername}?text=${encodeURIComponent(
    `Halo ${fullName}, terima kasih telah mengajukan pinjaman di SMART FUND. Ada yang bisa kami bantu?`
  )}`;

  const inlineKeyboard = [
    [{ text: '📊 Lihat Dashboard Admin', url: dashboardUrl }],
    [{ text: '💬 Chat User', url: chatUrl }],
  ];

  const message = `
🔔 <b>PENGAJUAN PINJAMAN BARU</b>

👤 <b>Data Peminjam:</b>
• Nama: ${fullName}
• No. HP: ${phone}
• Email: ${email}
• ID User: #${userId}

💰 <b>Detail Pinjaman:</b>
• Jumlah: ${fmt(amount)}
• Tenor: ${tenor} bulan
• Tujuan: ${purpose}

📊 <b>Perhitungan:</b>
• Cicilan/Bulan: ${fmt(monthlyPayment)}
• Total Bunga: ${fmt(totalInterest)}
• Total Bayar: ${fmt(totalPayment)}

🆔 Application ID: <b>#${applicationId}</b>
⏰ Waktu: ${date}

<i>Segera verifikasi dan proses pengajuan ini melalui dashboard admin.</i>
  `.trim();

  return { message, inlineKeyboard };
}

function parseTelegramStartParam(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const match = trimmed.match(/^\/start(?:\s+(.+))?$/i) || trimmed.match(/(?:^|[?&])start=([A-Za-z0-9_-]+)/i);
  if (!match) return null;
  const value = (match[1] || '').trim();
  return value || (trimmed.includes('start=') ? trimmed.split('start=')[1].split(/[&\s]/)[0] : null);
}

async function sendTelegramText(botToken, chatId, text) {
  if (!botToken || !chatId) {
    return { success: false, message: 'Bot token / chat id belum dikonfigurasi.' };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const { data } = await axios.post(url, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }, { timeout: 10000 });

    if (data.ok) {
      return { success: true, data };
    }

    return { success: false, message: data.description || 'Gagal mengirim pesan Telegram' };
  } catch (err) {
    const details = err.response && err.response.data && err.response.data.description
      ? err.response.data.description
      : err.message;
    return { success: false, message: details };
  }
}

async function handleTelegramWebhookUpdate(update, botTokenOverride) {
  const message = update && update.message;
  if (!message || !message.chat || !message.chat.id) {
    return { success: false, message: 'Update Telegram tidak valid.' };
  }

  const startParam = parseTelegramStartParam(message.text);
  if (startParam && startParam.toLowerCase() === 'kyc') {
    const config = await getTelegramSettings();
    const botToken = botTokenOverride || config.botToken;
    if (!botToken) {
      return { success: false, message: 'Bot token belum dikonfigurasi.' };
    }

    const replyToUser = await sendTelegramText(botToken, message.chat.id, KYC_MESSAGE);
    let adminNotice = { success: false, message: 'admin_chat_id belum dikonfigurasi' };

    if (config.adminChatId) {
      adminNotice = await sendTelegram(KYC_MESSAGE, { chatId: config.adminChatId, parseMode: 'HTML' });
    }

    return {
      success: replyToUser.success || adminNotice.success,
      message: KYC_MESSAGE,
      userReply: replyToUser,
      adminNotice,
    };
  }

  return { success: false, message: 'Payload Telegram tidak sesuai.' };
}

module.exports = {
  sendTelegram,
  buildLoanApplicationMessage,
  getTelegramSettings,
  handleTelegramWebhookUpdate,
  parseTelegramStartParam,
  KYC_MESSAGE,
  DEFAULT_TELEGRAM_BOT_TOKEN: DEFAULT_TELEGRAM_BOT_TOKEN,
  DEFAULT_TELEGRAM_ADMIN_CHAT_ID: DEFAULT_TELEGRAM_ADMIN_CHAT_ID,
  DEFAULT_TELEGRAM_BOT_USERNAME: DEFAULT_TELEGRAM_BOT_USERNAME,
};