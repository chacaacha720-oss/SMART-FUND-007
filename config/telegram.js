/**
 * SMART FUND - Telegram Bot Notification Service
 * Mengirim notifikasi pengajuan pinjaman ke admin via Telegram Bot API
 */
// Load .env only in local/development; Railway provides env vars at runtime
if (process.env.NODE_ENV !== 'production' && !process.env.RAILWAY_ENVIRONMENT) {
  require('dotenv').config();
}
const axios = require('axios');
const db = require('./db');
const { t, formatCurrency, formatDateTime } = require('./i18n');

const DEFAULT_TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8654004646:AAGkmAzCFjUiSp8ff9tCj6xDun6iHoogTUM';
const DEFAULT_TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '8176355378';
const DEFAULT_TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'smartfundx_bot';
const DEFAULT_TELEGRAM_ADMIN_USERNAME = process.env.TELEGRAM_ADMIN_USERNAME || 'cs_smartfund';
const KYC_MESSAGE = `Verifikasi / KYC belum aktif lakukan verifikasi\n\nUntuk melanjutkan penarikan`;

async function getTelegramSettings() {
  try {
    const [rows] = await db.query(
      `SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('telegram_bot_token', 'telegram_admin_chat_id', 'telegram_bot_username', 'telegram_admin_username')`
    );
    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    return {
      botToken: settings.telegram_bot_token || DEFAULT_TELEGRAM_BOT_TOKEN,
      adminChatId: settings.telegram_admin_chat_id || DEFAULT_TELEGRAM_ADMIN_CHAT_ID,
      botUsername: settings.telegram_bot_username || DEFAULT_TELEGRAM_BOT_USERNAME,
      adminUsername: settings.telegram_admin_username || DEFAULT_TELEGRAM_ADMIN_USERNAME,
    };
  } catch (err) {
    console.warn('[Telegram] getTelegramSettings DB error, using defaults:', err.message);
    return {
      botToken: DEFAULT_TELEGRAM_BOT_TOKEN,
      adminChatId: DEFAULT_TELEGRAM_ADMIN_CHAT_ID,
      botUsername: DEFAULT_TELEGRAM_BOT_USERNAME,
      adminUsername: DEFAULT_TELEGRAM_ADMIN_USERNAME,
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
  const botToken = options.botToken || config.botToken || DEFAULT_TELEGRAM_BOT_TOKEN;
  const chatId = options.chatId || config.adminChatId || DEFAULT_TELEGRAM_ADMIN_CHAT_ID;
  const parseMode = options.parseMode || 'HTML';

  console.log('[Telegram] Attempting to send notification', {
    hasBotToken: !!botToken,
    hasChatId: !!chatId,
    chatIdPrefix: chatId ? String(chatId).substring(0, 4) + '...' : 'null',
  });

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
 * Format notifikasi pengajuan pinjaman baru (locale-aware)
 */
async function buildLoanApplicationMessage(data) {
  const {
    fullName, phone, email, amount, tenor, purpose,
    monthlyPayment, totalInterest, totalPayment, applicationId, userId, lang,
  } = data;

  const language = lang || 'id';
  const fmt = (n) => formatCurrency(language, n);
  const date = formatDateTime(language, new Date().toISOString());
  const config = await getTelegramSettings();
  // SITE_URL from env - set in Railway to https://your-domain.up.railway.app for production links.
  // If empty, uses relative path (works in both localhost & Railway)
  const siteUrl = process.env.SITE_URL || '';
  const dashboardUrl = siteUrl
    ? `${siteUrl}/admin.html#applications`
    : '/admin.html#applications';
  const chatUrl = `https://t.me/${config.botUsername}?text=${encodeURIComponent(
    t(language, 'telegram.welcomeChat', fullName)
  )}`;

  const inlineKeyboard = [
    [{ text: t(language, 'telegram.viewDashboard'), url: dashboardUrl }],
    [{ text: t(language, 'telegram.chatUser'), url: chatUrl }],
  ];

  const message = `
🔔 <b>${t(language, 'telegram.newLoanTitle')}</b>

👤 <b>${t(language, 'telegram.borrowerData')}:</b>
• ${t(language, 'telegram.name')}: ${fullName}
• ${t(language, 'telegram.phone')}: ${phone}
• ${t(language, 'telegram.email')}: ${email}
• ID User: #${userId}

💰 <b>${t(language, 'telegram.loanDetail')}:</b>
• ${t(language, 'telegram.amount')}: ${fmt(amount)}
• ${t(language, 'telegram.tenor')}: ${tenor} ${t(language, 'telegram.month')}
• ${t(language, 'telegram.purpose')}: ${purpose}

📊 <b>${t(language, 'telegram.calculation')}:</b>
• ${t(language, 'telegram.monthly')}: ${fmt(monthlyPayment)}
• ${t(language, 'telegram.totalInterest')}: ${fmt(totalInterest)}
• ${t(language, 'telegram.totalPayment')}: ${fmt(totalPayment)}

🆔 Application ID: <b>#${applicationId}</b>
⏰ ${t(language, 'telegram.time')}: ${date}

<i>${t(language, 'telegram.verifyPrompt')}</i>
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

/**
 * Build withdrawal notification message (locale-aware)
 */
async function buildWithdrawalNotification(data) {
  const {
    withdrawalId, userId, fullName, phone, email, bank,
    accountNumber, accountHolder, amount, lang,
  } = data;

  const language = lang || 'id';
  const fmt = (n) => new Intl.NumberFormat(language === 'id' ? 'id-ID' : language === 'ms' ? 'ms-MY' : 'en-US').format(n);
  const currencySymbol = language === 'id' || language === 'ms' ? 'Rp' : '$';
  const date = new Date().toLocaleString(language === 'id' ? 'id-ID' : 'en-US', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `🔔 <b>${language === 'id' ? 'PENARIKAN BARU' : language === 'ms' ? 'PENARIKAN BARU' : 'NEW WITHDRAWAL'}</b>

ID Penarikan:
<b>${withdrawalId}</b>

ID Member:
${userId}

Nama:
${fullName}

No HP:
${phone}

Email:
${email}

Bank:
${bank}

Nomor Rekening:
${accountNumber}

Nama Rekening:
${accountHolder}

Jumlah:
${currencySymbol}${fmt(amount)}

Tanggal:
${date}

Status:
${language === 'id' ? 'Menunggu Verifikasi' : language === 'ms' ? 'Menunggu Verifikasi' : 'Awaiting Verification'}`;
}

/**
 * Build Telegram admin chat URL with preset message
 */
function buildAdminChatUrl(withdrawalId, fullName) {
  const config = getTelegramSettings ? null : null; // settings loaded async inside getTelegramSettings
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'smartfundx_bot';
  const message = `Halo Admin,\n\nSaya baru saja mengajukan penarikan dana.\n\nID Penarikan:\n${withdrawalId}\nNama: ${fullName}\n\nMohon bantu melakukan verifikasi agar proses penarikan saya dapat dilanjutkan.\n\nTerima kasih.`;
  return `https://t.me/${botUsername}?start=withdraw_${withdrawalId}`;
}

/**
 * Build full admin redirect URL with preset message for member
 */
async function getAdminRedirectUrl(withdrawalId, fullName) {
  const config = await getTelegramSettings();
  const adminUsername = config.adminUsername || 'cs_smartfund';
  const message = `Halo Admin,\n\nSaya baru saja mengajukan penarikan dana.\n\nID Penarikan:\n${withdrawalId}\nNama: ${fullName}\n\nMohon bantu melakukan verifikasi agar proses penarikan saya dapat dilanjutkan.\n\nTerima kasih`;
  return `https://t.me/${adminUsername}?text=${encodeURIComponent(message)}`;
}

module.exports = {
  sendTelegram,
  buildLoanApplicationMessage,
  buildWithdrawalNotification,
  buildAdminChatUrl,
  getAdminRedirectUrl,
  getTelegramSettings,
  handleTelegramWebhookUpdate,
  parseTelegramStartParam,
  KYC_MESSAGE,
  DEFAULT_TELEGRAM_BOT_TOKEN: DEFAULT_TELEGRAM_BOT_TOKEN,
  DEFAULT_TELEGRAM_ADMIN_CHAT_ID: DEFAULT_TELEGRAM_ADMIN_CHAT_ID,
  DEFAULT_TELEGRAM_BOT_USERNAME: DEFAULT_TELEGRAM_BOT_USERNAME,
  DEFAULT_TELEGRAM_ADMIN_USERNAME: DEFAULT_TELEGRAM_ADMIN_USERNAME,
};