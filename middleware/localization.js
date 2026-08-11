/**
 * SMART FUND - Localization Middleware
 *
 * Sets the active locale, currency, and formatting helpers on every request.
 *
 * Detection priority:
 *  1. User Setting (X-Lang header sent by frontend, or ?lang= query)
 *  2. Cookie (lang cookie)
 *  3. Local Storage (handled client-side, communicated via X-Lang header)
 *  4. Browser Language (Accept-Language header)
   * Default: 'id' (Bahasa Indonesia)
   *
   * Attaches to request:
   *  - req.lang       -> language code (id | ms | en)
   *  - req.language   -> same as req.lang (alias)
   *  - req.locale     -> locale string (id-ID | ms-MY | en-US)
   *  - req.currency   -> currency code (IDR | MYR | USD)
   *  - req.t          -> translation fn: req.t(key, ...args)
   *  - req.fmtCurrency -> formatCurrency fn: req.fmtCurrency(amount)
   *  - req.fmtNumber   -> formatNumber fn: req.fmtNumber(num)
   *  - req.fmtDate     -> formatDate fn: req.fmtDate(dateStr)
   *  - req.fmtDateTime -> formatDateTime fn: req.fmtDateTime(dateStr)
   *  - req.statusLabel -> statusLabel fn: req.statusLabel(status)
   */
const { detectLang, t, getLocaleConfig, formatCurrency, formatNumber, formatDate, formatDateTime, statusLabel } = require('../config/i18n');

/**
 * Resolve the active language for a request.
    * Priority: query ?lang= > X-Lang header > cookie > Accept-Language > default 'id'
   */
function resolveLanguage(req) {
  // 1. Explicit query parameter (?lang=en)
  if (req.query && req.query.lang) {
    const q = String(req.query.lang).toLowerCase();
    if (['id', 'ms', 'en'].includes(q)) return q;
  }

  // 2. Custom X-Lang header (sent by frontend from localStorage)
  if (req.headers && req.headers['x-lang']) {
    const h = String(req.headers['x-lang']).toLowerCase();
    if (['id', 'ms', 'en'].includes(h)) return h;
  }

   // 3. Cookie (lang=id)
   if (req.headers && req.headers.cookie) {
     const match = req.headers.cookie.match(/(?:^|;\s*)lang=(id|ms|en)\b/i);
     if (match) return match[1].toLowerCase();
   }

   // 4. Accept-Language header
   if (req.headers && req.headers['accept-language']) {
     const primary = req.headers['accept-language'].split(',')[0].split('-')[0].split(';')[0].trim().toLowerCase();
     if (['id', 'ms', 'en'].includes(primary)) return primary;
   }

   // 5. Default
   return 'id';
}

/**
 * Localization middleware - attach locale/currency/formatters to req
 * Also wraps res.json() to include locale/currency in every API response:
    *   { locale: 'id-ID', currency: 'IDR', ...originalResponse }
   */
function localizationMiddleware(req, res, next) {
  const lang = resolveLanguage(req);
  const config = getLocaleConfig(lang);

  req.lang = lang;
  req.language = lang;
  req.locale = config.locale;
  req.currency = config.currency;

  // Convenience formatters bound to the active language
  req.t = (key, ...args) => t(lang, key, ...args);
  req.fmtCurrency = (amount) => formatCurrency(lang, amount);
  req.fmtNumber = (num) => formatNumber(lang, num);
  req.fmtDate = (dateStr) => formatDate(lang, dateStr);
  req.fmtDateTime = (dateStr) => formatDateTime(lang, dateStr);
  req.statusLabel = (status) => statusLabel(lang, status);

  // Wrap res.json to include locale & currency envelope
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Ensure body is an object before adding envelope keys
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      return originalJson({
        locale: config.locale,
        currency: config.currency,
        ...body,
      });
    }
    return originalJson(body);
  };

  next();
}

module.exports = { localizationMiddleware, resolveLanguage };
