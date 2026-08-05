/* ============================================
   SMART FUND - API Helper & Utilities
   ============================================ */

const BASE_PATH = '';
const API_BASE = `${BASE_PATH}/api`;

// ============================================
// TOKEN MANAGEMENT
// ============================================
const Token = {
  get() {
    return localStorage.getItem('sf_token') || sessionStorage.getItem('sf_token');
  },
  set(token, remember = false) {
    if (remember) localStorage.setItem('sf_token', token);
    else sessionStorage.setItem('sf_token', token);
  },
  clear() {
    localStorage.removeItem('sf_token');
    sessionStorage.removeItem('sf_token');
    localStorage.removeItem('sf_user');
    sessionStorage.removeItem('sf_user');
    localStorage.removeItem('sf_admin_token');
    sessionStorage.removeItem('sf_admin_token');
    localStorage.removeItem('sf_admin');
    sessionStorage.removeItem('sf_admin');
  },
};

const AdminToken = {
  get() {
    return localStorage.getItem('sf_admin_token') || sessionStorage.getItem('sf_admin_token');
  },
  set(token, remember = false) {
    if (remember) {
      localStorage.setItem('sf_admin_token', token);
    } else {
      sessionStorage.setItem('sf_admin_token', token);
    }
  },
};

// ============================================
// API CALL
// ============================================
async function api(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  // Attach the right token based on the endpoint scope
  const isAdminEndpoint = endpoint.startsWith('/admin');
  const token = isAdminEndpoint ? AdminToken.get() : Token.get();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { ...options, headers };

  // If body is FormData, remove Content-Type (browser sets boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
    config.body = options.body;
  } else if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      // Auto logout on 401
      if (res.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
        Token.clear();
        if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('admin')) {
          window.location.href = `${BASE_PATH}/login.html`;
        }
      }
      return { success: false, message: data.message || 'Terjadi kesalahan', errors: data.errors, data: data.data };
    }
    return data;
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, message: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.' };
  }
}

// ============================================
// FORMATTERS
// ============================================
// ============================================
// CURRENCY FORMATTING (mendukung Rp, RM, USD)
// ============================================
// ============================================
// CURRENCY RATES (Real-time dari API)
// ============================================
let CURRENCY_RATES = {
  IDR: 1,        // Rupiah (dasar)
  MYR: 0.00029,  // Ringgit Malaysia (fallback)
  USD: 0.000062, // US Dollar (fallback)
};

// Fetch real-time exchange rates
async function fetchExchangeRates() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/IDR');
    const data = await res.json();
    if (data && data.rates) {
      CURRENCY_RATES.MYR = data.rates.MYR || CURRENCY_RATES.MYR;
      CURRENCY_RATES.USD = data.rates.USD || CURRENCY_RATES.USD;
      console.log('Exchange rates updated:', CURRENCY_RATES);
    }
  } catch (err) {
    console.warn('Failed to fetch exchange rates, using fallback:', err);
  }
}

// Fetch rates on load
fetchExchangeRates();
// Refresh rates every 5 minutes
setInterval(fetchExchangeRates, 5 * 60 * 1000);

function getCurrencySymbol() {
  const lang = (typeof I18N !== 'undefined' && I18N.getLang) ? I18N.getLang() : 'id';
  if (lang === 'ms') return 'RM';
  if (lang === 'en') return '$';
  return 'Rp';
}

function getCurrencyLocale() {
  const lang = (typeof I18N !== 'undefined' && I18N.getLang) ? I18N.getLang() : 'id';
  if (lang === 'ms') return 'ms-MY';
  if (lang === 'en') return 'en-US';
  return 'id-ID';
}

function getCurrencyRate() {
  const lang = (typeof I18N !== 'undefined' && I18N.getLang) ? I18N.getLang() : 'id';
  if (lang === 'ms') return CURRENCY_RATES.MYR;
  if (lang === 'en') return CURRENCY_RATES.USD;
  return CURRENCY_RATES.IDR;
}

function formatCurrency(amount) {
  const symbol = getCurrencySymbol();
  const locale = getCurrencyLocale();
  const rate = getCurrencyRate();
  const converted = Number(amount || 0) * rate;
  return symbol + ' ' + converted.toLocaleString(locale, { maximumFractionDigits: 0 });
}

// Backward compatibility - formatRupiah sekarang mengikuti bahasa aktif
function formatRupiah(amount) {
  return formatCurrency(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusBadge(status) {
  const map = {
    pending: { class: 'badge-pending', text: 'Menunggu' },
    approved: { class: 'badge-approved', text: 'Disetujui' },
    disbursed: { class: 'badge-disbursed', text: 'Dana Cair' },
    rejected: { class: 'badge-rejected', text: 'Ditolak' },
    completed: { class: 'badge-completed', text: 'Lunas' },
    active: { class: 'badge-active', text: 'Aktif' },
    frozen: { class: 'badge-frozen', text: 'Dibekukan' },
  };
  const s = map[status] || { class: 'badge-pending', text: status };
  return `<span class="badge ${s.class}">${s.text}</span>`;
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = 'success') {
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-500',
    info: 'bg-blue-600',
  };
  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info',
  };
  const toast = document.createElement('div');
  toast.className = `sf-toast ${colors[type] || colors.info}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info} mr-2"></i> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============================================
// SWEETALERT WRAPPERS
// ============================================
async function alertSuccess(title, text) {
  return Swal.fire({ icon: 'success', title, text, confirmButtonColor: '#2563eb' });
}
async function alertError(title, text) {
  return Swal.fire({ icon: 'error', title, text, confirmButtonColor: '#2563eb' });
}
async function alertConfirm(title, text, confirmText = 'Ya', cancelText = 'Batal') {
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#64748b',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
  return result.isConfirmed;
}

// ============================================
// LOADING BUTTON
// ============================================
function setBtnLoading(btn, loading = true) {
  if (!btn) return;
  if (loading) {
    if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.innerHTML = `<span class="btn-spinner"><span class="spinner"></span></span><span class="btn-text">${btn.dataset.originalHtml}</span>`;
  } else {
    btn.disabled = false;
    btn.classList.remove('btn-loading');
    if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
  }
}

// ============================================
// DARK MODE
// ============================================
const DarkMode = {
  init() {
    const saved = localStorage.getItem('sf_dark');
    if (saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  },
  toggle() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('sf_dark', isDark);
    return isDark;
  },
  isDark() {
    return document.documentElement.classList.contains('dark');
  },
};

// ============================================
// AUTH GUARDS
// ============================================
async function requireUser() {
  const token = Token.get();
  if (!token) {
    window.location.href = `${BASE_PATH}/login.html`;
    return null;
  }
  const res = await api('/auth/me');
  if (!res.success) {
    Token.clear();
    window.location.href = `${BASE_PATH}/login.html`;
    return null;
  }
  return res.data;
}

async function requireAdmin() {
  const token = AdminToken.get();
  if (!token) {
    window.location.href = `${BASE_PATH}/admin.html`;
    return null;
  }
  const res = await api('/admin/me');
  if (!res.success) {
    Token.clear();
    window.location.href = `${BASE_PATH}/admin.html`;
    return null;
  }
  return res.data;
}

// ============================================
// PAGE LOADER
// ============================================
function hidePageLoader() {
  const loader = document.getElementById('pageLoader');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 300);
  }
}

// Init dark mode on load
DarkMode.init();