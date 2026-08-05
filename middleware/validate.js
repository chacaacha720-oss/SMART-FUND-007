/**
 * SMART FUND - Validation Middleware
 * Server-side validation & sanitization
 */
const validator = require('validator');
const { t } = require('../config/i18n');

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
 * Validasi nomor HP Indonesia (08xxx / +62xxx)
 */
function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(\+62|62|0)8[1-9]\d{6,11}$/.test(cleaned);
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
  const lang = req.lang || 'id';
  const { fullName, email, phone, password, confirmPassword } = req.body;
  const errors = [];

  if (!fullName || validator.isEmpty(fullName.trim())) errors.push(t(lang, 'val.nameRequired'));
  else if (fullName.trim().length < 3) errors.push(t(lang, 'val.nameMin'));

  if (!email || !isValidEmail(email)) errors.push(t(lang, 'val.emailInvalid'));
  if (!phone || !isValidPhone(phone)) errors.push(t(lang, 'val.phoneInvalid'));
  if (!password || !isStrongPassword(password)) errors.push(t(lang, 'val.passwordWeak'));
  if (password !== confirmPassword) errors.push(t(lang, 'val.passwordMatch'));

  if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });
  next();
}

/**
 * Validasi login
 */
function validateLogin(req, res, next) {
  const lang = req.lang || 'id';
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
  const lang = req.lang || 'id';
  const { amount, tenor, purpose } = req.body;
  const errors = [];

  const amt = parseFloat(amount);
  const ten = parseInt(tenor, 10);

  if (!amt || isNaN(amt) || amt < 1000000 || amt > 500000000) errors.push(t(lang, 'val.amountRange'));
  if (!ten || isNaN(ten) || ten < 6 || ten > 60) errors.push(t(lang, 'val.tenorRange'));
  if (!purpose || validator.isEmpty(String(purpose).trim())) errors.push(t(lang, 'val.purposeRequired'));

  if (errors.length) return res.status(400).json({ success: false, message: errors[0], errors });
  next();
}

module.exports = {
  sanitize,
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  validateRegister,
  validateLogin,
  validateLoanApplication,
};