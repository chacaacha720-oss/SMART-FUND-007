/**
 * SMART FUND - i18n Middleware
 * Detects user language from request and attaches locale info to req
 *
 * Detection priority:
 * 1. Query parameter (?lang=en)
 * 2. Cookie (lang=ms)
 * 3. Custom X-Lang header (sent by frontend from localStorage)
 * 4. Accept-Language header
 * 5. Default: 'id' (Indonesian)
 *
 * Attaches to request:
 *  - req.lang       -> language code (id | ms | en)
 *  - req.language   -> same as req.lang (alias)
 *  - req.locale     -> locale string (id-ID | ms-MY | en-US)
 *  - req.currency   -> currency code (IDR | MYR | USD)
 *  - req.t          -> bound translation function
 *  - req.fmtCurrency -> formatted currency string
 *  - req.fmtNumber   -> formatted number string
 *  - req.fmtDate     -> formatted date string
 *  - req.fmtDateTime -> formatted datetime string
 */
const { localizationMiddleware } = require('./localization');

module.exports = { i18nMiddleware: localizationMiddleware };