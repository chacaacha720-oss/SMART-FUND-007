/* ============================================
   SMART FUND - Global Currency & Number Formatter
   Uses Intl.NumberFormat() to format values per locale.
   NO currency conversion is performed - only formatting.

   Indonesia: Rp10.000.000
   Malaysia:  RM10,000
   English:   $10,000.00
   ============================================ */

const Currency = {
  /**
   * Get the active language code
   */
  getLang() {
    return (typeof I18N !== 'undefined' && I18N.getLang) ? I18N.getLang() : 'id';
  },

  /**
   * Get the active locale config (fallback to Indonesia)
   */
  config() {
    const lang = this.getLang();
    // LocaleConfig is optional; default to id-ID if not loaded
    if (typeof LocaleConfig !== 'undefined' && LocaleConfig.get) {
      return LocaleConfig.get(lang);
    }
    return { locale: 'id-ID', currency: 'IDR', symbol: 'Rp' };
  },

  /**
   * Format a number using Intl.NumberFormat
   * @param {number} amount - The numeric value
   * @param {object} options - NumberFormat options
   */
  number(amount, options = {}) {
    const cfg = this.config();
    const num = Number(amount || 0);
    return num.toLocaleString(cfg.locale, options);
  },

  /**
   * Format currency WITHOUT conversion (symbol + formatted number)
   * Indonesia: Rp10.000.000
   * Malaysia:  RM10,000
   * English:   $10,000.00
   */
  format(amount, options = {}) {
    const cfg = this.config();
    const num = Number(amount || 0);
    const formatted = num.toLocaleString(cfg.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      ...options,
    });
    return `${cfg.symbol}${formatted}`;
  },

  /**
   * Format currency with decimals (for English display like $10,000.00)
   */
  formatDecimal(amount, decimals = 2) {
    const cfg = this.config();
    const num = Number(amount || 0);
    const formatted = num.toLocaleString(cfg.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${cfg.symbol}${formatted}`;
  },

  /**
   * Get the currency code for the active language
   */
  code() {
    return this.config().currency;
  },

  /**
   * Get the currency symbol for the active language
   */
  symbol() {
    return this.config().symbol;
  },

  /**
   * Format a date per locale
   * Indonesia: 31 Desember 2026
   * English:   December 31, 2026
   * Malaysia:  31 Disember 2026
   */
  date(dateStr, options = {}) {
    if (!dateStr) return '-';
    const cfg = this.config();
    const d = new Date(dateStr);
    return d.toLocaleDateString(cfg.locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      ...options,
    });
  },

  /**
   * Format date and time per locale
   */
  dateTime(dateStr, options = {}) {
    if (!dateStr) return '-';
    const cfg = this.config();
    const d = new Date(dateStr);
    return d.toLocaleString(cfg.locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    });
  },

  /**
   * Format a percentage
   */
  percent(value, decimals = 0) {
    return `${Number(value || 0)}%`;
  },
};

// ============================================
// BACKWARD COMPATIBILITY HELPERS
// All pages use these global helpers
// ============================================

/**
 * formatRupiah is now locale-aware via Currency.format
 */
function formatRupiah(amount) {
  return Currency.format(amount);
}

/**
 * formatCurrency - locale-aware that follows active language
 */
function formatCurrency(amount) {
  return Currency.format(amount);
}

/**
 * getCurrencySymbol - returns symbol for active language
 */
function getCurrencySymbol() {
  return Currency.symbol();
}

/**
 * getCurrencyLocale - returns locale for active language
 */
function getCurrencyLocale() {
  return Currency.config().locale;
}

/**
 * formatDate - locale-aware date formatter
 */
function formatDate(dateStr) {
  return Currency.date(dateStr);
}

/**
 * formatDateTime - locale-aware date-time formatter
 */
function formatDateTime(dateStr) {
  return Currency.dateTime(dateStr);
}

// Expose globally
window.Currency = Currency;
