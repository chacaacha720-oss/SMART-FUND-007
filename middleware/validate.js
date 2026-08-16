/**
 * SMART FUND - Validation Middleware
 * Server-side validation & sanitization
 */
const validator = require('validator');
const { t } = require('../config/i18n');
const { parsePhoneNumberFromString, getCountries, getCountryCallingCode } = require('libphonenumber-js');

/**
 * Map calling code -> ISO countries (for auto-detection of country from leading digits)
 */
const CC_MAP = {};
for (const iso of getCountries()) {
  const cc = getCountryCallingCode(iso);
  (CC_MAP[cc] = CC_MAP[cc] || []).push(iso);
}
const CC_PREFIXES = Object.keys(CC_MAP).sort((a, b) => b.length - a.length);

/**
 * Normalisasi nomor HP ke format E.164 internasional.
 * Menerima input dengan/tanpa '+', dengan/tanpa country code, dan mengenali
 * country calling code secara otomatis (mis. 60123456789 -> +60123456789).
 * Mengembalikan null jika nomor tidak valid menurut validasi internasional.
 */
function normalizePhone(raw) {
  if (typeof raw !== 'string') return null;
  let s = raw.trim().replace(/[\s().\-]/g, '');
  if (!s) return null;

  if (s.startsWith('+')) {
    const p = parsePhoneNumberFromString(s);
    return p && p.isValid() ? p.number : null;
  }

  if (s.startsWith('00')) s = s.slice(2); // exit code internasional
  const digits = s.replace(/\D/g, '');
  if (!digits) return null;

  for (const cc of CC_PREFIXES) {
    if (digits.startsWith(cc)) {
      for (const iso of CC_MAP[cc]) {
        const p = parsePhoneNumberFromString(digits, iso);
        if (p && p.isValid()) return p.number;
      }
    }
  }
  return null;
}

/**
 * Sanitasi string - trim & escape untuk mencegah XSS
 */
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return validator.escape(validator.trim(str));
}

/**
 * Validasi email
 */
function isValidEmail(email) {
  return typeof email === 'string' && validator.isEmail(email);
}

/**
 * Validasi nomor HP internasional (mendukung semua negara).
 * Mengenali country calling code secara otomatis dan menormalisasi ke E.164.
 */
function isValidPhone(phone) {
  return normalizePhone(phone) !== null;
}

/**
 * Validasi password kuat
 */
function isStrongPassword(password) {
  if (typeof password !== 'string') return false;
  // min 6 char, max 100, mengandung huruf & angka
  return password.length >= 6 && password.length <= 100 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

/**
 * Validasi registrasi user
 */
function validateRegister(req, res, next) {
  const lang = req.lang || 'ms';
    const { fullName, email, phone, password, confirmPassword, csCode } = req.body;
  const errors = [];

  if (!fullName || validator.isEmpty(fullName.trim())) errors.push(t(lang, 'val.nameRequired'));
  else if (fullName.trim().length < 3) errors.push(t(lang, 'val.nameMin'));

  if (!email || !isValidEmail(email)) errors.push(t(lang, 'val.emailInvalid'));
  if (!phone || !isValidPhone(phone)) errors.push(t(lang, 'val.phoneInvalid'));
    if (!password || !isStrongPassword(password)) errors.push(t(lang, 'val.passwordWeak'));
    if (password !== confirmPassword) errors.push(t(lang, 'val.passwordMatch'));

    // Validate CS code if provided
    if (csCode !== undefined) {
      const code = (csCode || '').trim();
      if (code && !/^CS\d{2}$/.test(code)) errors.push(t(lang, 'val.csCodeInvalid'));
    }

  if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });
  next();
}

/**
 * Validasi login
 */
function validateLogin(req, res, next) {
  const lang = req.lang || 'ms';
  const { identifier, password } = req.body;
  const errors = [];
  if (!identifier || validator.isEmpty(identifier.trim())) errors.push(t(lang, 'val.identifierRequired'));
  if (!password || validator.isEmpty(password)) errors.push(t(lang, 'val.passwordRequired'));
  if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });
  next();
}

/**
 * Validasi pengajuan pinjaman
 */
function validateLoanApplication(req, res, next) {
  const lang = req.lang || 'ms';
  const { amount, tenor, purpose } = req.body;
  const errors = [];

  const amt = parseFloat(amount);
  const ten = parseInt(tenor, 10);

   if (!amt || isNaN(amt) || amt < 500 || amt > 300000) errors.push(t(lang, 'val.amountRange'));
  if (!ten || isNaN(ten) || ten < 6 || ten > 60) errors.push(t(lang, 'val.tenorRange'));
  if (!purpose || validator.isEmpty(String(purpose).trim())) errors.push(t(lang, 'val.purposeRequired'));

  if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });
  next();
}

module.exports = {
  sanitize,
  isValidEmail,
  isValidPhone,
  normalizePhone,
  isStrongPassword,
  validateRegister,
  validateLogin,
  validateLoanApplication,
};