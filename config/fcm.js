/**
 * SMART FUND - FCM Push Notification Service (Android APK)
 * Mengirim push notification ke peranti user via Firebase Cloud Messaging.
 * Menggunakan legacy FCM HTTP API (server key) — set FCM_SERVER_KEY di env.
 */
// Load .env only in local/development; Railway provides env vars at runtime
if (process.env.NODE_ENV !== 'production' && !process.env.RAILWAY_ENVIRONMENT) {
  require('dotenv').config();
}
const axios = require('axios');
const db = require('./db');

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || '';

/**
 * Kirim push notification ke satu user berdasarkan fcm_token tersimpan.
 * @param {number} userId - ID user di DB
 * @param {object} payload - { title, body, data }
 */
async function sendToUser(userId, { title, body, data = {} } = {}) {
  if (!FCM_SERVER_KEY) {
    console.warn('[FCM] FCM_SERVER_KEY belum di-set, push dilewati');
    return { skipped: true, reason: 'no_server_key' };
  }
  try {
    const [rows] = await db.query('SELECT fcm_token FROM users WHERE id = ?', [userId]);
    const token = rows[0] && rows[0].fcm_token;
    if (!token) return { skipped: true, reason: 'no_token' };

    const message = {
      to: token,
      priority: 'high',
      notification: { title, body },
      data: Object.assign({ title, body }, data),
    };

    const res = await axios.post('https://fcm.googleapis.com/fcm/send', message, {
      headers: {
        Authorization: 'key=' + FCM_SERVER_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    return { success: true, result: res.data };
  } catch (err) {
    console.error('[FCM] Gagal hantar push ke user', userId, ':', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendToUser, FCM_SERVER_KEY };
