/* ============================================
   SMART FUND - User Dashboard Logic
   ============================================ */

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Auth guard
  currentUser = await requireUser();
  if (!currentUser) return;
  hidePageLoader();

  // ============================================
  // INIT UI
  // ============================================
  const darkToggle = document.getElementById('darkToggle');
  const updateIcon = () => { darkToggle.innerHTML = DarkMode.isDark() ? '<i class="fas fa-sun text-amber-500"></i>' : '<i class="fas fa-moon text-slate-600"></i>'; };
  updateIcon();
  darkToggle.addEventListener('click', () => { DarkMode.toggle(); updateIcon(); });

  // User info
  document.getElementById('userName').textContent = currentUser.full_name;
  document.getElementById('userEmail').textContent = currentUser.email;
  document.getElementById('userAvatar').textContent = currentUser.full_name.charAt(0).toUpperCase();
  document.getElementById('welcomeName').textContent = currentUser.full_name.split(' ')[0];

  // Mobile sidebar
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuToggle = document.getElementById('menuToggle');
  const openSidebar = () => { sidebar.classList.add('open'); overlay.classList.add('show'); };
  const closeSidebar = () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); };
  menuToggle.removeEventListener('click', openSidebar);
  menuToggle.addEventListener('click', openSidebar);
  overlay.removeEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  // Sidebar navigation
  const pageTitles = {
    dashboard: I18N.t('dash.dashboard'),
    apply: I18N.t('dash.apply'),
    history: I18N.t('dash.history'),
    balance: I18N.t('dash.balance'),
    limit: I18N.t('dash.limit'),
  };
  function handleSidebarClick(e) {
    e.preventDefault();
    const page = this.dataset.page;
    document.querySelectorAll('.page-content').forEach((p) => p.classList.add('hidden'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.remove('hidden');
    document.querySelectorAll('.sidebar-link').forEach((l) => l.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('pageTitle').textContent = pageTitles[page] || I18N.t('dash.dashboard');
    closeSidebar();
    loadPageData(page);
  }
  document.querySelectorAll('.sidebar-link[data-page]').forEach((link) => {
    link.removeEventListener('click', handleSidebarClick);
    link.addEventListener('click', handleSidebarClick);
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    const ok = await alertConfirm(I18N.t('dash.logout'), I18N.t('notif.loginRequiredDesc'));
    if (ok) { Token.clear(); window.location.href = `${BASE_PATH}/login.html`; }
  });

  // Notifications
  document.getElementById('notifBtn').addEventListener('click', openNotifModal);
  document.getElementById('closeNotifBtn').addEventListener('click', closeNotifModal);

  // Withdrawal modal
  document.getElementById('openWithdrawBtn').addEventListener('click', openWithdrawModal);
  document.getElementById('closeWithdrawBtn').addEventListener('click', closeWithdrawModal);
  document.getElementById('withdrawForm').addEventListener('submit', submitWithdrawal);

  // ============================================
  // LOAD INITIAL DATA
  // ============================================
  await loadDashboard();
  await loadNotifications();

  // ============================================
  // APPLY LOAN
  // ============================================
  document.getElementById('applyFullName').value = currentUser.full_name;
  document.getElementById('applyPhone').value = currentUser.phone;
  document.getElementById('applyLimitInfo').textContent = formatRupiah(currentUser.loan_limit);

  // Display CS code (read-only) at top of loan form
  const csCodeEl = document.getElementById('applyAdminCodeValue');
  const csNameEl = document.getElementById('applyAdminNameValue');
  if (csCodeEl) {
    csCodeEl.textContent = currentUser.cs_code || I18N.t('cs.noCsCode', 'Tiada kod CS');
    csCodeEl.className = currentUser.cs_code ? 'font-bold text-blue-700 text-lg' : 'font-bold text-red-500 text-lg';
  }
  if (csNameEl) {
    csNameEl.textContent = currentUser.cs_name ? `CS: ${currentUser.cs_name}` : 'CS: -';
  }
  // Show CS code bar only on apply page
  const csCodeBar = document.getElementById('applyAdminCodeBar');
  if (csCodeBar) csCodeBar.classList.remove('hidden');

  const applyInd1 = document.getElementById('applyInd1');
  const applyInd2 = document.getElementById('applyInd2');
  const applyLine1 = document.getElementById('applyLine1');
  function applyStep1Active() {
    applyInd1.classList.remove('complete'); applyInd1.classList.add('active');
    applyInd2.classList.remove('active', 'complete'); applyInd2.classList.add('inactive');
    if (applyLine1) { applyLine1.classList.remove('active'); applyLine1.classList.add('inactive'); }
  }
  function applyStep2Active() {
    applyInd1.classList.remove('active'); applyInd1.classList.add('complete');
    applyInd2.classList.remove('inactive', 'complete'); applyInd2.classList.add('active');
    if (applyLine1) { applyLine1.classList.remove('inactive'); applyLine1.classList.add('active'); }
  }
  document.getElementById('applyNextBtn').addEventListener('click', () => {
    document.getElementById('applyStep1').classList.add('hidden');
    document.getElementById('applyStep2').classList.remove('hidden');
    applyStep2Active();
  });
  document.getElementById('applyBackBtn').addEventListener('click', () => {
    document.getElementById('applyStep2').classList.add('hidden');
    document.getElementById('applyStep1').classList.remove('hidden');
    applyStep1Active();
  });

  // Estimasi real-time
  function updateEstimasi() {
    const amount = parseFloat(document.getElementById('applyAmount').value) || 0;
    const tenor = parseInt(document.getElementById('applyTenor').value, 10);
    if (amount >= 2000 && amount <= 300000 && tenor > 0) {
      const rate = 5 / 100 / 12;
      const monthly = amount * (rate * Math.pow(1 + rate, tenor)) / (Math.pow(1 + rate, tenor) - 1);
      const total = monthly * tenor;
      const interest = total - amount;
      document.getElementById('applyEstMonthly').textContent = formatRupiah(monthly);
      document.getElementById('applyEstInterest').textContent = formatRupiah(interest);
      document.getElementById('applyEstTotal').textContent = formatRupiah(total);
    }
  }
  document.getElementById('applyAmount').addEventListener('input', updateEstimasi);
  document.getElementById('applyTenor').addEventListener('change', updateEstimasi);

  document.getElementById('applySubmitBtn').addEventListener('click', async () => {
    const amount = parseFloat(document.getElementById('applyAmount').value);
    const tenor = parseInt(document.getElementById('applyTenor').value, 10);
    const purpose = document.getElementById('applyPurpose').value;

    const lang = I18N.getLang();
    const i18n = (key, fallback) => I18N.t(key) || fallback;

    if (!amount || amount < 2000 || amount > 300000) return showToast(i18n('val.amountRange', 'Jumlah pinjaman RM2000 - RM300,000'), 'error');
    if (amount > currentUser.loan_limit) return showToast(`${i18n('dash.limit', 'Had')}: ${Currency.format(currentUser.loan_limit)}`, 'error');
    if (!purpose) return showToast(i18n('val.purposeRequired', 'Tujuan pinjaman diperlukan'), 'error');
    if (!currentUser.cs_code) return showToast(I18N.t('cs.noCsCode', 'Anda belum berdaftar dengan kod CS. Hubungi admin untuk mendapatkan kod pendaftaran.'), 'error');

    const cardValid = validateCardNumber();
    const expiryValid = validateCardExpiry();
    const cvvValid = validateCardCvv();

    if (!cardValid || !expiryValid || !cvvValid) {
      return;
    }

    const btn = document.getElementById('applySubmitBtn');
    setBtnLoading(btn, true);
    const res = await api('/loans/apply', { method: 'POST', body: { amount, tenor, purpose } });
    setBtnLoading(btn, false);

    if (res.success) {
      await alertSuccess(I18N.t('notif.applySuccess'), `${I18N.t('notif.applySuccessDesc')} #${res.data.applicationId}`);
      document.getElementById('applyStep2').classList.add('hidden');
      document.getElementById('applyStep1').classList.remove('hidden');
      document.getElementById('applyAmount').value = '';
      document.getElementById('applyPurpose').value = '';

      await openLoanAdminConfirmation(res.data.applicationId, amount, tenor, purpose);
      await loadDashboard();
      const dashLink = document.querySelector('.sidebar-link[data-page="dashboard"]');
      if (dashLink) dashLink.click();
      // Notify admin (other tab) that there is a new application
      document.dispatchEvent(new CustomEvent('applySuccess'));
    } else {
      showToast(res.message || I18N.t('notif.applyFailed'), 'error');
    }
  });

});

// ============================================
// LOAD FUNCTIONS
// ============================================
async function loadDashboard() {
  const res = await api('/user/dashboard');
  if (!res.success) return;
  const d = res.data;
  const availableBalance = Number(d.saldoPinjaman || 0);
  document.getElementById('statBalance').textContent = formatRupiah(d.saldoPinjaman);
   document.getElementById('statLimit').textContent = Currency.number(d.limitPinjaman, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('statTagihan').textContent = formatRupiah(availableBalance);
  document.getElementById('balanceAmount').textContent = formatRupiah(d.saldoPinjaman);
  document.getElementById('balanceLimit').textContent = formatRupiah(d.limitPinjaman);
  const limitEl = document.getElementById('limitAmount');
  if (limitEl) {
    limitEl.textContent = formatRupiah(d.limitPinjaman);
    limitEl.classList.add('whitespace-nowrap', 'overflow-x-auto');
    // Fallback: jika angka panjang, turunkan ukuran font di HP
    if (limitEl.scrollWidth > limitEl.clientWidth) {
      limitEl.classList.add('text-2xl');
      limitEl.classList.remove('sm:text-4xl');
    }
  }
  const statusText = d.statusAkun === 'active' ? I18N.t('status.active') : d.statusAkun === 'frozen' ? I18N.t('status.frozen') : d.statusAkun;
  document.getElementById('accountStatus').textContent = statusText;
  document.getElementById('balanceStatus').textContent = d.statusAkun === 'active' ? I18N.t('status.active') : I18N.t('status.frozen');
  const badge = document.getElementById('accountStatusBadge');
  badge.className = `badge ${d.statusAkun === 'active' ? 'badge-active' : 'badge-frozen'}`;
  badge.textContent = statusText;

  const withdrawAmountInput = document.getElementById('withdrawAmount');
  withdrawAmountInput.max = String(Math.max(availableBalance, 0));
  withdrawAmountInput.value = Math.max(availableBalance, 0);

  // Last application
  const lastAppEl = document.getElementById('lastApplication');
  if (d.statusPengajuan) {
    lastAppEl.innerHTML = `
      <div class="text-left">
        <div class="flex justify-between mb-2"><span class="text-slate-500">ID</span><span class="font-bold">#${d.statusPengajuan.id}</span></div>
        <div class="flex justify-between mb-2"><span class="text-slate-500">${I18N.t('dash.amount')}</span><span class="font-bold">${formatRupiah(d.statusPengajuan.amount)}</span></div>
        <div class="flex justify-between mb-2"><span class="text-slate-500">${I18N.t('dash.status')}</span>${statusBadge(d.statusPengajuan.status)}</div>
        <div class="flex justify-between"><span class="text-slate-500">${I18N.t('dash.createdAt')}</span><span>${formatDate(d.statusPengajuan.created_at)}</span></div>
      </div>`;
  }

  // Recent transactions
  const txEl = document.getElementById('recentTransactions');
  const balTxEl = document.getElementById('balanceTransactions');
  if (d.riwayatTransaksi && d.riwayatTransaksi.length) {
    const html = d.riwayatTransaksi.map((t) => `
      <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 ${t.type === 'disbursement' ? 'bg-green-100' : 'bg-blue-100'} rounded-lg flex items-center justify-center">
            <i class="fas ${t.type === 'disbursement' ? 'fa-arrow-down' : 'fa-arrow-up'} ${t.type === 'disbursement' ? 'text-green-600' : 'text-blue-600'}"></i>
          </div>
          <div><p class="text-sm font-semibold text-slate-800">${t.description || t.type}</p><p class="text-xs text-slate-400">${formatDate(t.created_at)}</p></div>
        </div>
        <span class="font-bold ${t.type === 'disbursement' ? 'text-green-600' : 'text-slate-700'}">${formatRupiah(t.amount)}</span>
      </div>`).join('');
    txEl.innerHTML = html;
    balTxEl.innerHTML = html;
  }
}

async function loadPageData(page) {
  if (page === 'history') {
    const res = await api('/loans/my');
    const container = document.getElementById('historyContainer');
    const emptyState = document.getElementById('historyEmptyState');
    if (res.success && Array.isArray(res.data) && res.data.length) {
      emptyState.classList.add('hidden');
      container.innerHTML = res.data.map((l, idx) => `
        <div class="loan-history-card bg-white dark:bg-slate-900 dark:border-slate-700 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 sm:p-6 transition-all duration-300 hover:shadow-md dark:hover:border-slate-600">
          <div class="flex items-start justify-between mb-4">
            <span class="text-sm font-semibold text-slate-600 dark:text-slate-400">#${idx + 1}</span>
            ${statusBadge(l.status)}
          </div>
          <div class="mb-4">
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">${I18N.t('dash.amount')}</p>
            <p class="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">${formatRupiah(l.amount)}</p>
          </div>
          <div class="border-t border-slate-100 dark:border-slate-700 my-4"></div>
          <div class="grid grid-cols-2 gap-3 sm:gap-4 mb-4 text-left">
            <div>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">${I18N.t('dash.tenor')}</p>
              <p class="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">${l.tenor} ${I18N.t('dash.monthShort')}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">${I18N.t('dash.monthly')}</p>
              <p class="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">${formatRupiah(l.monthly_payment)}</p>
            </div>
          </div>
          <div class="border-t border-slate-100 dark:border-slate-700 my-4"></div>
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center text-slate-500 dark:text-slate-400">
              <i class="fas fa-calendar mr-1.5 text-xs"></i>
              <span>${I18N.t('dash.submittedShort')}</span>
            </div>
            <span class="text-slate-700 dark:text-slate-300 font-medium">${formatDate(l.created_at)}</span>
          </div>
        </div>`).join('');
    } else {
      emptyState.classList.remove('hidden');
      container.innerHTML = '';
    }
  }
}

async function loadNotifications() {
  const res = await api('/user/notifications');
  if (!res.success) return;
  const badge = document.getElementById('notifBadge');
  const unread = res.data.filter((n) => !n.is_read).length;
  if (unread > 0) {
    badge.classList.remove('hidden');
    badge.textContent = unread > 9 ? '9+' : unread;
  } else {
    badge.classList.add('hidden');
  }
  window._notifications = res.data;
}

function openNotifModal() {
  const modal = document.getElementById('notifModal');
  const list = document.getElementById('notifList');
  const notifs = window._notifications || [];
  if (notifs.length === 0) {
    list.innerHTML = `<div class="text-center py-8 text-slate-400"><i class="fas fa-bell-slash text-4xl mb-3"></i><p>${I18N.t('dash.noTx')}</p></div>`;
  } else {
    list.innerHTML = notifs.map((n) => `
      <div class="p-4 rounded-xl ${n.is_read ? 'bg-slate-50' : 'bg-blue-50 border border-blue-100'} cursor-pointer" onclick="markNotifRead(${n.id})">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 ${n.type === 'success' ? 'bg-green-100' : n.type === 'error' ? 'bg-red-100' : n.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'} rounded-lg flex items-center justify-center flex-shrink-0">
            <i class="fas ${n.type === 'success' ? 'fa-circle-check text-green-600' : n.type === 'error' ? 'fa-circle-xmark text-red-600' : n.type === 'warning' ? 'fa-triangle-exclamation text-amber-600' : 'fa-circle-info text-blue-600'}"></i>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-slate-800 text-sm">${n.title}</p>
            <p class="text-sm text-slate-600 mt-1">${n.message}</p>
            <p class="text-xs text-slate-400 mt-1">${formatDateTime(n.created_at)}</p>
          </div>
        </div>
      </div>`).join('');
  }
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeNotifModal() {
  const modal = document.getElementById('notifModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function openWithdrawModal() {
  const modal = document.getElementById('withdrawModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeWithdrawModal() {
  const modal = document.getElementById('withdrawModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function submitWithdrawal(e) {
  try {
    if (e && e.preventDefault) e.preventDefault();
  } catch (err) { /* ignore */ }

  const amountEl = document.getElementById('withdrawAmount');
  const bankEl = document.getElementById('withdrawBank');
  const nameEl = document.getElementById('withdrawAccountName');
  const numEl = document.getElementById('withdrawAccountNumber');

  if (!amountEl || !bankEl || !nameEl || !numEl) {
    return showToast(I18N.t('notif.withdrawFailed'), 'error');
  }

  const amount = parseFloat(amountEl.value) || 0;
  const bankName = bankEl.value.trim();
  const accountHolder = nameEl.value.trim();
  const accountNumber = numEl.value.trim();

  const i18n = (key, fallback) => I18N.t(key) || fallback;

   if (!amount || amount < 100000) {
      return showToast(i18n('val.minWithdraw', 'Jumlah pengeluaran minimum RM100,000'), 'error');
   }
   if (!bankName || !accountHolder || !accountNumber) {
     return showToast(i18n('val.withdrawRequired', 'Semua data akaun diperlukan'), 'error');
  }

  const btn = document.getElementById('withdrawSubmitBtn');
  try {
    setBtnLoading(btn, true);
    const res = await api('/user/withdrawals', {
      method: 'POST',
      body: { amount, bankName, accountHolder, accountNumber },
    });
    setBtnLoading(btn, false);

    if (!res.success) {
      return showToast(res.message || I18N.t('notif.withdrawFailed'), 'error');
    }

    closeWithdrawModal();
    await loadDashboard();
    // Notify admin (other tab) that there is a new withdrawal
    document.dispatchEvent(new CustomEvent('withdrawSuccess'));

    if (typeof Swal !== 'undefined') {
      await Swal.fire({
        icon: 'warning',
         title: i18n('notif.verifyWithdrawTitle', 'Segera Sahkan Pengeluaran'),
        html: `
           <p class="text-slate-600 mb-4">${i18n('notif.verifyWithdrawDesc', 'permohonan pengeluaran anda telah dihantar. Sila hubungi admin untuk mendapatkan kod pengcairan')}</p>
        `,
        confirmButtonText: i18n('notif.chatTelegram', '💬 Chat Admin via Telegram'),
        showDenyButton: true,
        denyButtonText: i18n('notif.chatWhatsapp', '📱 Chat Admin via WhatsApp'),
        allowOutsideClick: false,
      }).then((result) => {
        if (result.isConfirmed) {
          const chatMessage = I18N.t('notif.chatMessage', 'Hai Admin, saya baru sahaja menghantar pengeluaran. Sila bantu verifikasi untuk meneruskan pengeluaran saya.');
          const telegramUrl = `https://t.me/cs_smartfund?text=${encodeURIComponent(chatMessage)}`;
          window.open(telegramUrl, '_blank', 'noopener,noreferrer');
        } else if (result.isDenied) {
          const whatsappMessage = I18N.t('notif.whatsappMessage', 'Pengesahan / KYC belum aktif, sila lakukan pengesahan\n\nUntuk meneruskan pengeluaran');
          const whatsappUrl = `https://wa.me/6289679875858?text=${encodeURIComponent(whatsappMessage)}`;
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        }
      });
    }
    showToast(res.message || I18N.t('notif.withdrawSent'), 'success');
  } catch (err) {
    setBtnLoading(btn, false);
    console.error('Withdrawal error:', err);
    showToast(I18N.t('notif.withdrawFailed'), 'error');
  }
}

async function openLoanAdminConfirmation(applicationId, amount, tenor, purpose) {
  const telegramMessage = I18N.t('notif.loanChatMessage', 'Hai Admin, saya baru sahaja mengajukan pinjaman. Sila bantu pengesahan agar permohonan pinjaman saya dapat segera diproses.');
  const whatsappMessage = I18N.t('notif.loanWhatsappMsg') || 'Pengesahan / KYC belum aktif, sila lakukan pengesahan\n\nUntuk meneruskan permohonan pinjaman';

  await Swal.fire({
     icon: 'success',
     title: I18N.t('notif.loanSuccess'),
     html: `
        <div class="text-left space-y-4">
          <p class="text-slate-600">${I18N.t('notif.loanSuccessText')}</p>
          <p class="text-slate-600">${I18N.t('notif.loanCurrentStatus')}</p>
          <p class="text-slate-600 font-medium">${I18N.t('notif.loanStatusWaiting')}</p>
          <p class="text-slate-600">${I18N.t('notif.loanSpeedUp')}</p>
          <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-slate-700">
            <p class="font-semibold text-slate-800 mb-2"><i class="fas fa-circle-info mr-1 text-blue-600"></i> ${I18N.t('notif.loanContactAdmin')}</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button id="loanTelegramChatBtn" class="w-full rounded-xl bg-sky-500 text-white px-4 py-3 font-semibold hover:bg-sky-600 transition">
                <i class="fab fa-telegram-plane mr-2"></i> ${I18N.t('notif.loanTelegramBtn')}
              </button>
              <button id="loanWhatsappChatBtn" class="w-full rounded-xl bg-emerald-500 text-white px-4 py-3 font-semibold hover:bg-emerald-600 transition">
                <i class="fab fa-whatsapp mr-2"></i> ${I18N.t('notif.loanWhatsappBtn')}
              </button>
            </div>
          </div>
        </div>
      `,
    showCancelButton: true,
    showConfirmButton: false,
    cancelButtonText: I18N.t('admin.close'),
    allowOutsideClick: false,
    didOpen: () => {
      const telegramBtn = document.getElementById('loanTelegramChatBtn');
      const whatsappBtn = document.getElementById('loanWhatsappChatBtn');

      telegramBtn.addEventListener('click', () => {
        const telegramUrl = `https://t.me/cs_smartfund?text=${encodeURIComponent(telegramMessage)}`;
        window.open(telegramUrl, '_blank', 'noopener,noreferrer');
      });

      whatsappBtn.addEventListener('click', () => {
        const whatsappUrl = `https://wa.me/6289679875858?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      });
    },
  });

   showToast(I18N.t('notif.loanSubmitted'), 'success');
}

async function markNotifRead(id) {
  await api(`/user/notifications/${id}/read`, { method: 'PUT' });
  await loadNotifications();
  openNotifModal();
}

// ============================================
// LANGUAGE CHANGE - Reload data untuk update mata uang
// ============================================
document.addEventListener('languageChanged', () => {
  if (typeof loadDashboard === 'function') {
    loadDashboard();
  }
  if (typeof loadPageData === 'function') {
    const activePage = document.querySelector('.sidebar-link.active')?.dataset.page || 'dashboard';
    loadPageData(activePage);
  }
});

// ============================================
// REAL-TIME SYNC - Dashboard User <-> Admin
// Using BroadcastChannel so changes in
// admin appear immediately on user dashboard
// tanpa perlu refresh manual.
// ============================================
const SyncChannel = (() => {
  let channel = null;
  let channelError = false;
  let lastData = '';

  // Daftar BroadcastChannel (fallback ke polling jika gagal)
  try {
    channel = new BroadcastChannel('smartfund_sync');
  } catch (e) {
    channelError = true;
  }

  /**
   * Call dashboard data probe.
   * If data signature changes (balance, status, applications),
   * reload UI and show notification.
   */
  async function probe() {
    try {
      const res = await api('/user/dashboard');
      if (!res.success) return;
      const signature = JSON.stringify(res.data);
      if (lastData && lastData !== signature) {
        // Data changed -> reload UI
        if (typeof loadDashboard === 'function') loadDashboard();
        if (typeof loadNotifications === 'function') loadNotifications();
        const activePage = document.querySelector('.sidebar-link.active')?.dataset.page || 'dashboard';
        if (typeof loadPageData === 'function') loadPageData(activePage);
        // Show sync indicator
        const syncEl = document.getElementById('syncIndicator');
        if (syncEl) {
          syncEl.classList.remove('hidden');
          syncEl.textContent = `🔄 ${I18N.t('dash.dataUpdated', 'Data telah dikemaskini')} ${formatDateTime(new Date().toISOString())}`;
          setTimeout(() => syncEl.classList.add('hidden'), 5000);
        }
      }

      lastData = signature;
      const syncTime = document.getElementById('syncTime');
      if (syncTime) syncTime.textContent = formatDateTime(new Date().toISOString());
    } catch (e) {
      // ignore - next polling cycle
    }
  } // end probe()

  // Receive message from another tab (e.g. admin changes data)
  if (channel && !channelError) {
    channel.onmessage = (event) => {
      const msg = event.data;
      if (msg && msg.type === 'data_changed') {
        // Immediately reload UI without waiting for signature comparison
        if (typeof loadDashboard === 'function') loadDashboard();
        if (typeof loadNotifications === 'function') loadNotifications();
        const activePage = document.querySelector('.sidebar-link.active')?.dataset.page || 'dashboard';
        if (typeof loadPageData === 'function') loadPageData(activePage);
        // Show sync indicator
        const syncEl = document.getElementById('syncIndicator');
        if (syncEl) {
          syncEl.classList.remove('hidden');
          syncEl.textContent = `🔄 ${I18N.t('dash.dataUpdated', 'Data telah dikemaskini')} ${formatDateTime(new Date().toISOString())}`;
          setTimeout(() => syncEl.classList.add('hidden'), 5000);
        }
        // Update baseline signature
        lastData = '';
      }
    };
  }

  // Panggil probe() langsung untuk set baseline, lalu polling setiap 10 detik
  probe();
  setInterval(probe, 10000);

  /**
   * Notify other tab that data has changed (called when user
   * submits loan/withdrawal so admin knows immediately).
   */
  function notifyDataChanged() {
    if (channel && !channelError) {
      try { channel.postMessage({ type: 'data_changed', source: 'user' }); } catch (e) { /* ignore */ }
    }
  }

  // Terapkan update waktu sinkron pada language change
  document.addEventListener('languageChanged', () => {
    const syncTime = document.getElementById('syncTime');
    if (syncTime) syncTime.textContent = formatDateTime(new Date().toISOString());
  });

  return { notifyDataChanged };
})();

// Hook to notify admin when user submits data
// (submit loan / withdrawal). The actual fetch is done in the main handler.
document.addEventListener('applySuccess', () => SyncChannel.notifyDataChanged());
document.addEventListener('withdrawSuccess', () => SyncChannel.notifyDataChanged());

// ==========================================
// VALIDASI KAD DEBIT
// ==========================================

const cardNumberInput = document.getElementById('applyCardNumber');
const cardExpiryInput = document.getElementById('applyCardExpiry');
const cardCvvInput = document.getElementById('applyCardCvv');

const cardNumberError = document.getElementById('cardNumberError');
const cardNumberSuccess = document.getElementById('cardNumberSuccess');
const cardExpiryError = document.getElementById('cardExpiryError');
const cardCvvError = document.getElementById('cardCvvError');

// ------------------------------------------
// Luhn Check
// ------------------------------------------
function isValidCardNumber(number) {
  const digits = number.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (shouldDouble) {
      digit *= 2;

      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// ------------------------------------------
// Format nombor kad
// ------------------------------------------
cardNumberInput?.addEventListener('input', function () {
  let value = this.value.replace(/\D/g, '');

  value = value.substring(0, 19);

  this.value = value.replace(/(.{4})/g, '$1 ').trim();

  validateCardNumber();
});

// ------------------------------------------
// Semak nombor kad
// ------------------------------------------
function validateCardNumber() {
  const number = cardNumberInput ? cardNumberInput.value : '';

  if (cardNumberError) cardNumberError.classList.add('hidden');
  if (cardNumberSuccess) cardNumberSuccess.classList.add('hidden');

  if (!number) {
    if (cardNumberInput) {
      cardNumberInput.classList.remove('border-red-500');
      cardNumberInput.classList.add('border-slate-300');
    }
    return false;
  }

  if (isValidCardNumber(number)) {
    if (cardNumberSuccess) cardNumberSuccess.classList.remove('hidden');
    if (cardNumberInput) {
      cardNumberInput.classList.remove('border-red-500');
      cardNumberInput.classList.add('border-green-500');
    }
    return true;
  } else {
    if (cardNumberError) cardNumberError.classList.remove('hidden');
    if (cardNumberInput) {
      cardNumberInput.classList.remove('border-green-500');
      cardNumberInput.classList.add('border-red-500');
    }
    return false;
  }
}

// ------------------------------------------
// Format MM/YY
// ------------------------------------------
cardExpiryInput?.addEventListener('input', function () {
  let value = this.value.replace(/\D/g, '');

  value = value.substring(0, 4);

  if (value.length >= 3) {
    value = value.substring(0, 2) + '/' + value.substring(2);
  }

  this.value = value;

  validateCardExpiry();
});

// ------------------------------------------
// Semak tarikh luput
// ------------------------------------------
function validateCardExpiry() {
  const value = cardExpiryInput ? cardExpiryInput.value : '';

  if (cardExpiryError) cardExpiryError.classList.add('hidden');

  if (!/^\d{2}\/\d{2}$/.test(value)) {
    if (value.length > 0 && cardExpiryError) {
      cardExpiryError.classList.remove('hidden');
    }

    return false;
  }

  const [month, year] = value.split('/').map(Number);

  if (month < 1 || month > 12) {
    if (cardExpiryError) cardExpiryError.classList.remove('hidden');
    return false;
  }

  const currentDate = new Date();

  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;

  if (
    year < currentYear ||
    (year === currentYear && month < currentMonth)
  ) {
    if (cardExpiryError) cardExpiryError.classList.remove('hidden');
    return false;
  }

  return true;
}

// ------------------------------------------
// CVV
// ------------------------------------------
cardCvvInput?.addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '').substring(0, 4);

  validateCardCvv();
});

function validateCardCvv() {
  const cvv = cardCvvInput ? cardCvvInput.value : '';

  if (cardCvvError) cardCvvError.classList.add('hidden');

  if (!/^\d{3,4}$/.test(cvv)) {
    if (cvv.length > 0 && cardCvvError) {
      cardCvvError.classList.remove('hidden');
    }

    return false;
  }

  return true;
}
