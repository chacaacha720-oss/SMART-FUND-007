/* ============================================
   SMART FUND - Locale Manager
    Manages locale codes: ms-MY, en-US
   ============================================ */

const LocaleConfig = {
  locales: {
    ms: { locale: 'ms-MY', currency: 'MYR', symbol: 'RM', label: 'Bahasa Malaysia' },
    en: { locale: 'en-MY', currency: 'MYR', symbol: 'RM', label: 'English' },
  },

  get(lang) {
    return this.locales[lang] || this.locales.ms;
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
    const lang = (typeof I18N !== 'undefined' && I18N.getLang) ? I18N.getLang() : 'ms';
    return this.get(lang);
  },
};

// Global registry for use by currency.js and other helpers
window.LocaleConfig = LocaleConfig;