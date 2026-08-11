/* ============================================
   SMART FUND - Locale Manager
   Manages locale codes: id-ID, en-US, ms-MY
   ============================================ */

const LocaleConfig = {
  locales: {
    id: { locale: 'id-ID', currency: 'IDR', symbol: 'Rp', label: 'Bahasa Indonesia' },
    ms: { locale: 'ms-MY', currency: 'MYR', symbol: 'RM', label: 'Bahasa Malaysia' },
    en: { locale: 'en-US', currency: 'USD', symbol: '$', label: 'English' },
  },

  get(lang) {
    return this.locales[lang] || this.locales.id;
  },

  getLocale(lang) {
    return this.get(lang).locale;
  },

  getCurrency(lang) {
    return this.get(lang).currency;
  },

  getSymbol(lang) {
    return this.get(lang).symbol;
  },

  getLabel(lang) {
    return this.get(lang).label;
  },

  current() {
    const lang = (typeof I18N !== 'undefined' && I18N.getLang) ? I18N.getLang() : 'id';
    return this.get(lang);
  },
};

// Global registry for use by currency.js and other helpers
window.LocaleConfig = LocaleConfig;