/* ============================================
   SMART FUND - Admin Dashboard Logic
   ============================================ */

let currentAdmin = null;
let statsChart = null;
let allUsers = [];
let currentAppId = null;
let currentUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
  hidePageLoader();

  // Dark mode
  const darkToggle = document.getElementById('darkToggle');
  const updateIcon = () => { darkToggle.innerHTML = DarkMode.isDark() ? '<i class="fas fa-sun text-amber-500"></i>' : '<i class="fas fa-moon text-slate-600"></i>'; };
  updateIcon();
  darkToggle.addEventListener('click', () => { DarkMode.toggle(); updateIcon(); });

  // Toggle admin password
  const toggleAdminPwd = document.getElementById('toggleAdminPwd');
  const adminPwdInput = document.getElementById('adminPassword');
  toggleAdminPwd.addEventListener('click', () => {
    const isPwd = adminPwdInput.type === 'password';
    adminPwdInput.type = isPwd ? 'text' : 'password';
    toggleAdminPwd.innerHTML = isPwd ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
  });

  // Check if already logged in
  if (AdminToken.get()) {
    const admin = await requireAdmin();
    if (admin) { showAdminApp(admin); return; }
  }

  // Admin login form
  document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value.trim();
    const password = adminPwdInput.value;
    if (!username || !password) return showToast(I18N.t('admin.userPassRequired', 'Username dan password wajib diisi'), 'error');

    const btn = document.getElementById('adminLoginBtn');
    setBtnLoading(btn, true);
    const res = await api('/admin/auth/login', { method: 'POST', body: { username, password } });
    setBtnLoading(btn, false);

    if (res.success) {
      AdminToken.set(res.token, true);
      showToast(I18N.t('admin.loginSuccess', 'Login admin berhasil!'), 'success');
      setTimeout(() => showAdminApp(res.data), 500);
    } else {
      showToast(res.message || I18N.t('admin.loginFailed', 'Login gagal'), 'error');
    }
  });
});

// ============================================
// SHOW ADMIN APP
// ============================================
async function showAdminApp(admin) {
  currentAdmin = admin;
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminApp').classList.remove('hidden');
  document.getElementById('adminName').textContent = admin.full_name || admin.username;
  document.getElementById('adminRole').textContent = admin.role === 'super_admin' ? 'Super Admin' : 'Admin';

  // Mobile sidebar
  const sidebar = document.getElementById('adminSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuToggle = document.getElementById('adminMenuToggle');
  const openSidebar = () => { sidebar.classList.add('open'); overlay.classList.add('show'); };
  const closeSidebar = () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); };
  menuToggle.removeEventListener('click', openSidebar);
  menuToggle.addEventListener('click', openSidebar);
  overlay.removeEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  // Navigation
  const pageTitles = {
    dashboard: I18N.t('admin.dashboard'),
    users: I18N.t('admin.users'),
    applications: I18N.t('admin.applications'),
    transactions: I18N.t('admin.transactions'),
    telegram: I18N.t('admin.telegram'),
    settings: I18N.t('admin.settings'),
  };
  document.querySelectorAll('.admin-link').forEach((link) => {
    link.removeEventListener('click', handleAdminNavClick);
    link.addEventListener('click', handleAdminNavClick);
  });
  function handleAdminNavClick(e) {
    e.preventDefault();
    const page = this.dataset.page;
    document.querySelectorAll('.admin-content').forEach((p) => p.classList.add('hidden'));
    document.getElementById(`apage-${page}`).classList.remove('hidden');
    document.querySelectorAll('.admin-link').forEach((l) => l.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('adminPageTitle').textContent = pageTitles[page];
    closeSidebar();
    loadAdminPage(page);
  }

  // Logout
  document.getElementById('adminLogoutBtn').addEventListener('click', async () => {
    const ok = await alertConfirm(I18N.t('dash.logout'), I18N.t('notif.loginRequiredDesc'));
    if (ok) { Token.clear(); window.location.href = `${BASE_PATH}/admin.html`; }
  });

  // Load dashboard
  await loadAdminDashboard();

  // User search
  document.getElementById('userSearch').addEventListener('input', (e) => renderUsersTable(allUsers, e.target.value));

  // Save user
  document.getElementById('saveUserBtn').addEventListener('click', saveUser);

  // Application actions
  document.getElementById('appApproveBtn').addEventListener('click', () => updateAppStatus('approved'));
  document.getElementById('appRejectBtn').addEventListener('click', () => updateAppStatus('rejected'));
  document.getElementById('appDisburseBtn').addEventListener('click', () => updateAppStatus('disbursed'));

  // Telegram actions
  document.getElementById('tgSaveBtn').addEventListener('click', saveTelegramSettings);
  document.getElementById('tgTestBtn').addEventListener('click', testTelegram);

  // Settings form
  document.getElementById('settingsForm').addEventListener('submit', saveSettings);
}

// ============================================
// DASHBOARD
// ============================================
async function loadAdminDashboard() {
  const res = await api('/admin/dashboard');
  if (!res.success) return;
  const d = res.data;
  document.getElementById('aTotalUser').textContent = d.totalUser;
  document.getElementById('aTotalPengajuan').textContent = d.totalPengajuan;
  document.getElementById('aPinjamanAktif').textContent = d.pinjamanAktif;
  document.getElementById('aDanaCair').textContent = formatRupiah(d.danaCair);
  document.getElementById('aPinjamanLunas').textContent = d.pinjamanLunas;
  document.getElementById('aUserAktif').textContent = d.totalUserActive;

  // Chart
  const ctx = document.getElementById('statsChart').getContext('2d');
  if (statsChart) statsChart.destroy();
  const labels = d.chartData.map((c) => c.month);
  const totals = d.chartData.map((c) => c.total);
  const danaCair = d.chartData.map((c) => c.dana_cair);
  statsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: I18N.t('admin.totalApp'), data: totals, backgroundColor: '#2563eb', borderRadius: 8 },
        { label: I18N.t('admin.disbursed'), data: danaCair, backgroundColor: '#16a34a', borderRadius: 8 },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } },
  });

  // Recent apps
  const recentEl = document.getElementById('recentApps');
  if (d.recentApplications.length) {
    recentEl.innerHTML = d.recentApplications.map((a) => `
      <div class="p-3 bg-slate-50 rounded-xl">
        <div class="flex justify-between mb-1"><span class="font-semibold text-sm text-slate-800">#${a.id} ${a.full_name}</span>${statusBadge(a.status)}</div>
        <div class="flex justify-between text-xs text-slate-500"><span>${formatRupiah(a.amount)}</span><span>${formatDate(a.created_at)}</span></div>
      </div>`).join('');
  } else {
    recentEl.innerHTML = `<p class="text-center text-slate-400 py-4">${I18N.t('admin.noApplications')}</p>`;
  }
}

// ============================================
// LOAD PAGE
// ============================================
async function loadAdminPage(page) {
  if (page === 'users') await loadUsers();
  if (page === 'applications') await loadApplications();
  if (page === 'transactions') await loadTransactions();
  if (page === 'telegram') {
    await loadTelegramConfig();
    await loadTelegramLogs();
  }
  if (page === 'settings') await loadSettings();
}

// ============================================
// USERS
// ============================================
async function loadUsers() {
  const res = await api('/admin/users');
  if (!res.success) return;
  allUsers = res.data;
  renderUsersTable(allUsers);
}

function renderUsersTable(users, search = '') {
  const tbody = document.getElementById('usersTable');
  const filtered = search ? users.filter((u) => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) : users;
  if (!filtered.length) { tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-400">${I18N.t('admin.noUsers')}</td></tr>`; return; }
  tbody.innerHTML = filtered.map((u) => `
    <tr class="table-row hover:bg-slate-50 dark:hover:bg-slate-800/30">
      <td class="px-4 py-3 font-semibold text-slate-700">#${u.id}</td>
      <td class="px-4 py-3 text-slate-700">${u.full_name}</td>
      <td class="px-4 py-3 text-slate-500 text-sm">${u.email}</td>
      <td class="px-4 py-3 text-slate-700">${formatRupiah(u.balance)}</td>
      <td class="px-4 py-3 text-slate-700">${formatRupiah(u.loan_limit)}</td>
      <td class="px-4 py-3">${statusBadge(u.status)}</td>
      <td class="px-4 py-3">
        <button onclick="editUser(${u.id})" class="text-blue-600 hover:bg-blue-50 p-2 rounded-lg" title="${I18N.t('admin.editUser')}"><i class="fas fa-edit"></i></button>
        <button onclick="deleteUser(${u.id})" class="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="${I18N.t('admin.deleteUser')}"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function editUser(id) {
  const u = allUsers.find((x) => x.id === id);
  if (!u) return;
  currentUserId = id;
  document.getElementById('editUserName').value = u.full_name || '';
  document.getElementById('editUserEmail').value = u.email || '';
  document.getElementById('editUserPhone').value = u.phone || '';
  document.getElementById('editUserStatus').value = u.status || 'active';
  document.getElementById('editUserBalance').value = u.balance || 0;
  document.getElementById('editUserLimit').value = u.loan_limit || 0;
  const modal = document.getElementById('userModal');
  modal.classList.remove('hidden'); modal.classList.add('flex');
}

function closeUserModal() {
  const modal = document.getElementById('userModal');
  modal.classList.add('hidden'); modal.classList.remove('flex');
}

async function saveUser() {
  if (!currentUserId) return;

  // Parse numeric fields safely - empty/NaN values are omitted so the backend
  // does not receive NaN and cause a SQL error.
  const balanceVal = document.getElementById('editUserBalance').value;
  const loanLimitVal = document.getElementById('editUserLimit').value;
  const balance = balanceVal !== '' && !isNaN(parseFloat(balanceVal)) ? parseFloat(balanceVal) : undefined;
  const loanLimit = loanLimitVal !== '' && !isNaN(parseFloat(loanLimitVal)) ? parseFloat(loanLimitVal) : undefined;

  const body = {
    fullName: document.getElementById('editUserName').value,
    phone: document.getElementById('editUserPhone').value,
    status: document.getElementById('editUserStatus').value,
  };
  if (balance !== undefined) body.balance = balance;
  if (loanLimit !== undefined) body.loanLimit = loanLimit;

  const btn = document.getElementById('saveUserBtn');
  setBtnLoading(btn, true);
  const res = await api(`/admin/users/${currentUserId}`, { method: 'PUT', body });
  setBtnLoading(btn, false);
  if (res.success) {
    showToast(I18N.t('admin.userUpdated', 'User berhasil diperbarui'), 'success');
    closeUserModal();
    await loadUsers();
    // Beri tahu tab user bahwa data berubah
    AdminSync.notifyDataChanged();
  }
  else showToast(res.message || I18N.t('admin.noDataChanged'), 'error');
}

async function deleteUser(id) {
  const ok = await alertConfirm(I18N.t('admin.confirmDelete'), I18N.t('admin.confirmDeleteText'), I18N.t('admin.deleteUser'), I18N.t('admin.cancel'));
  if (!ok) return;
  const res = await api(`/admin/users/${id}`, { method: 'DELETE' });
  if (res.success) { showToast(I18N.t('admin.userDeleted', 'User dihapus'), 'success'); await loadUsers(); }
  else showToast(res.message || I18N.t('admin.noDataChanged'), 'error');
}

// ============================================
// APPLICATIONS
// ============================================
async function loadApplications() {
  const res = await api('/admin/applications');
  if (!res.success) return;
  const tbody = document.getElementById('appsTable');
  if (!res.data.length) { tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-400">${I18N.t('admin.noApplications')}</td></tr>`; return; }
  tbody.innerHTML = res.data.map((a) => `
    <tr class="table-row hover:bg-slate-50 dark:hover:bg-slate-800/30">
      <td class="px-4 py-3 font-semibold text-slate-700">#${a.id}</td>
      <td class="px-4 py-3 text-slate-700">${a.full_name}<div class="text-xs text-slate-400">${a.phone}</div></td>
      <td class="px-4 py-3 text-slate-700">${formatRupiah(a.amount)}</td>
      <td class="px-4 py-3 text-slate-700">${a.tenor} bln</td>
      <td class="px-4 py-3 text-slate-500 text-sm">${a.purpose}</td>
      <td class="px-4 py-3">${statusBadge(a.status)}</td>
      <td class="px-4 py-3">
        <button onclick="viewApp(${a.id})" class="text-blue-600 hover:bg-blue-50 p-2 rounded-lg" title="${I18N.t('admin.viewApp')}"><i class="fas fa-eye"></i></button>
      </td>
    </tr>`).join('');
}

async function viewApp(id) {
  const res = await api(`/admin/applications/${id}`);
  if (!res.success) return;
  const a = res.data;
  currentAppId = id;
  const body = document.getElementById('appModalBody');
  body.innerHTML = `
    <div class="grid md:grid-cols-2 gap-4">
      <div class="bg-slate-50 rounded-xl p-4">
        <h4 class="font-bold text-slate-800 mb-3"><i class="fas fa-user text-blue-600 mr-2"></i> Data Peminjam</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">Nama</span><span class="font-semibold">${a.full_name}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Email</span><span class="font-semibold">${a.email}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">No. HP</span><span class="font-semibold">${a.phone}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">NIK</span><span class="font-semibold">${a.nik || '-'}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Alamat</span><span class="font-semibold text-right">${a.address || '-'}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Pekerjaan</span><span class="font-semibold">${a.job || '-'}</span></div>
        </div>
      </div>
      <div class="bg-blue-50 rounded-xl p-4">
        <h4 class="font-bold text-slate-800 mb-3"><i class="fas fa-money-bill-wave text-blue-600 mr-2"></i> Detail Pinjaman</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">Jumlah</span><span class="font-bold">${formatRupiah(a.amount)}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Tenor</span><span class="font-semibold">${a.tenor} bulan</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Tujuan</span><span class="font-semibold">${a.purpose}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Cicilan/Bulan</span><span class="font-semibold">${formatRupiah(a.monthly_payment)}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Total Bunga</span><span class="font-semibold">${formatRupiah(a.total_interest)}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Total Bayar</span><span class="font-bold">${formatRupiah(a.total_payment)}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Status</span>${statusBadge(a.status)}</div>
          <div class="flex justify-between"><span class="text-slate-500">Tanggal</span><span class="font-semibold">${formatDateTime(a.created_at)}</span></div>
        </div>
      </div>
    </div>
    ${a.admin_note ? `<div class="bg-amber-50 rounded-xl p-4 text-sm"><b>Catatan Admin:</b> ${a.admin_note}</div>` : ''}
    <div>
      <label class="block text-sm font-semibold text-slate-700 mb-2">${I18N.t('admin.addNote')}</label>
      <textarea id="appNote" rows="2" class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none" placeholder="${I18N.t('admin.notePlaceholder')}">${a.admin_note || ''}</textarea>
    </div>`;
  const modal = document.getElementById('appModal');
  modal.classList.remove('hidden'); modal.classList.add('flex');
}

function closeAppModal() {
  const modal = document.getElementById('appModal');
  modal.classList.add('hidden'); modal.classList.remove('flex');
  currentAppId = null;
}

async function updateAppStatus(status) {
  if (!currentAppId) return;
  const note = document.getElementById('appNote')?.value || '';
  const labels = { approved: I18N.t('admin.approve'), rejected: I18N.t('admin.reject'), disbursed: I18N.t('admin.disburse') };
  const ok = await alertConfirm(`${I18N.t('admin.confirmDelete', 'Yakin ingin mengubah status')} #${currentAppId}?`, status === 'disbursed' ? I18N.t('admin.disburse') + ': Saldo user akan bertambah otomatis.' : '');
  if (!ok) return;
  const res = await api(`/admin/applications/${currentAppId}/status`, { method: 'PUT', body: { status, adminNote: note } });
  if (res.success) {
    showToast(`${I18N.t('admin.applications')} ${status === 'approved' ? I18N.t('status.approved') : status === 'rejected' ? I18N.t('status.rejected') : I18N.t('admin.disbursed').toLowerCase()}`, 'success');
    closeAppModal();
    await loadApplications();
    await loadAdminDashboard();
    // Beri tahu tab user bahwa status pengajuan berubah
    AdminSync.notifyDataChanged();
  } else {
    showToast(res.message || I18N.t('admin.noDataChanged'), 'error');
  }
}

// ============================================
// TRANSACTIONS
// ============================================
async function loadTransactions() {
  const res = await api('/admin/transactions');
  if (!res.success) return;
  const tbody = document.getElementById('txTable');
  if (!res.data.length) { tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-400">${I18N.t('admin.noTransactions')}</td></tr>`; return; }
  tbody.innerHTML = res.data.map((t) => `
    <tr class="table-row hover:bg-slate-50 dark:hover:bg-slate-800/30">
      <td class="px-4 py-3 font-semibold text-slate-700">#${t.id}</td>
      <td class="px-4 py-3 text-slate-700">${t.full_name}</td>
      <td class="px-4 py-3 text-slate-700 capitalize">${t.type.replace('_', ' ')}</td>
      <td class="px-4 py-3 text-slate-700">${formatRupiah(t.amount)}</td>
      <td class="px-4 py-3">${statusBadge(t.status)}</td>
      <td class="px-4 py-3 text-slate-500 text-sm">${formatDate(t.created_at)}</td>
      <td class="px-4 py-3">
        ${t.status === 'pending' ? `
          <button onclick="updateTxStatus(${t.id}, 'approved')" class="text-green-600 hover:bg-green-50 p-2 rounded-lg" title="${I18N.t('admin.approve')}"><i class="fas fa-check"></i></button>
          <button onclick="updateTxStatus(${t.id}, 'rejected')" class="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="${I18N.t('admin.reject')}"><i class="fas fa-times"></i></button>
        ` : '<span class="text-slate-300 text-xs">-</span>'}
      </td>
    </tr>`).join('');
}

async function updateTxStatus(id, status) {
  const ok = await alertConfirm(`${I18N.t(status === 'approved' ? 'admin.approve' : 'admin.reject')} transaksi #${id}?`, '');
  if (!ok) return;
  const res = await api(`/admin/transactions/${id}/status`, { method: 'PUT', body: { status } });
  if (res.success) {
    showToast(`Transaksi ${status}`, 'success');
    await loadTransactions();
    // Beri tahu tab user bahwa status transaksi berubah
    AdminSync.notifyDataChanged();
  }
  else showToast(res.message || I18N.t('admin.noDataChanged'), 'error');
}

// ============================================
// TELEGRAM
// ============================================
async function loadTelegramConfig() {
  const res = await api('/admin/settings');
  if (!res.success) return;
  const s = res.data || {};
  document.getElementById('tgToken').value = s.telegram_bot_token || '';
  document.getElementById('tgChatId').value = s.telegram_admin_chat_id || '';
  document.getElementById('tgBotUser').value = s.telegram_bot_username || 'smartfundonline_bot';
}

async function saveTelegramSettings() {
  const settings = {
    telegram_bot_token: document.getElementById('tgToken').value.trim(),
    telegram_admin_chat_id: document.getElementById('tgChatId').value.trim(),
    telegram_bot_username: document.getElementById('tgBotUser').value.trim() || 'smartfundonline_bot',
  };

  if (!settings.telegram_bot_token || !settings.telegram_admin_chat_id) {
    showToast(I18N.t('admin.telegram') + ': Bot Token dan Chat ID wajib diisi', 'error');
    return;
  }

  const btn = document.getElementById('tgSaveBtn');
  setBtnLoading(btn, true);
  const res = await api('/admin/settings', { method: 'PUT', body: { settings } });
  setBtnLoading(btn, false);

  if (res.success) {
    showToast(I18N.t('admin.telegramTestSuccess', 'Pengaturan Telegram berhasil disimpan'), 'success');
    await loadTelegramLogs();
  } else {
    showToast(res.message || I18N.t('admin.noDataChanged'), 'error');
  }
}

async function loadTelegramLogs() {
  const res = await api('/admin/telegram/logs');
  if (!res.success) return;
  const el = document.getElementById('tgLogs');
  if (!res.data.length) { el.innerHTML = `<p class="text-center text-slate-400 py-4">${I18N.t('admin.noTransactions')}</p>`; return; }
  el.innerHTML = res.data.slice(0, 20).map((l) => `
    <div class="p-3 ${l.status === 'sent' ? 'bg-green-50' : 'bg-red-50'} rounded-xl text-sm">
      <div class="flex justify-between mb-1">
        <span class="font-semibold ${l.status === 'sent' ? 'text-green-700' : 'text-red-700'}">${l.status === 'sent' ? '✓ Terkirim' : '✗ Gagal'}</span>
        <span class="text-xs text-slate-400">${formatDateTime(l.created_at)}</span>
      </div>
      <p class="text-slate-600 text-xs truncate">${l.message.substring(0, 80)}...</p>
    </div>`).join('');
}

async function testTelegram() {
  const res = await api('/admin/telegram/test', { method: 'POST' });
  if (res.success) { showToast(I18N.t('admin.telegramTestSuccess', 'Test telegram berhasil dikirim!'), 'success'); await loadTelegramLogs(); }
  else showToast(res.message || I18N.t('admin.telegramTestFailed'), 'error');
}

// ============================================
// SETTINGS
// ============================================
async function loadSettings() {
  const res = await api('/admin/settings');
  if (!res.success) return;
  const s = res.data;
  document.getElementById('setSiteName').value = s.site_name || '';
  document.getElementById('setTagline').value = s.site_tagline || '';
  document.getElementById('setMinLoan').value = s.min_loan || '';
  document.getElementById('setMaxLoan').value = s.max_loan || '';
  document.getElementById('setMinTenor').value = s.min_tenor || '';
  document.getElementById('setMaxTenor').value = s.max_tenor || '';
  document.getElementById('setInterest').value = s.interest_rate || '';
  document.getElementById('setDefaultLimit').value = s.default_loan_limit || '';
  document.getElementById('setContactEmail').value = s.contact_email || '';
  document.getElementById('setContactPhone').value = s.contact_phone || '';
}

async function saveSettings(e) {
  e.preventDefault();
  const settings = {
    site_name: document.getElementById('setSiteName').value,
    site_tagline: document.getElementById('setTagline').value,
    min_loan: document.getElementById('setMinLoan').value,
    max_loan: document.getElementById('setMaxLoan').value,
    min_tenor: document.getElementById('setMinTenor').value,
    max_tenor: document.getElementById('setMaxTenor').value,
    interest_rate: document.getElementById('setInterest').value,
    default_loan_limit: document.getElementById('setDefaultLimit').value,
    contact_email: document.getElementById('setContactEmail').value,
    contact_phone: document.getElementById('setContactPhone').value,
  };
  const btn = document.getElementById('settingsSaveBtn');
  setBtnLoading(btn, true);
  const res = await api('/admin/settings', { method: 'PUT', body: { settings } });
  setBtnLoading(btn, false);
  if (res.success) showToast(I18N.t('admin.settingsSaved', 'Pengaturan berhasil disimpan'), 'success');
  else showToast(res.message || I18N.t('admin.noDataChanged'), 'error');
}

// ============================================
// REAL-TIME SYNC - Admin <-> User Dashboard
// Menggunakan BroadcastChannel agar perubahan yang
// dilakukan admin langsung tampil di dashboard user
// tanpa perlu refresh manual.
// ============================================
const AdminSync = (() => {
  let channel = null;
  let channelError = false;

  // Register BroadcastChannel (fallback ke polling jika gagal)
  try {
    channel = new BroadcastChannel('smartfund_sync');
  } catch (e) {
    channelError = true;
  }

  /**
   * Beri tahu tab lain (dashboard user) bahwa data berubah.
   * Dipanggil setelah admin mengubah saldo, status, pengajuan, transaksi.
   */
  function notifyDataChanged() {
    if (channel && !channelError) {
      try { channel.postMessage({ type: 'data_changed', source: 'admin' }); } catch (e) { /* ignore */ }
    }
  }

  // Terima pesan dari tab user (misal user mengajukan pinjaman/penarikan)
  if (channel && !channelError) {
    channel.onmessage = (event) => {
      const msg = event.data;
      if (msg && msg.type === 'data_changed' && msg.source === 'user') {
        // Muat ulang data admin agar selalu sinkron
        if (typeof loadAdminDashboard === 'function') loadAdminDashboard();
        if (typeof loadUsers === 'function') loadUsers();
        if (typeof loadApplications === 'function') loadApplications();
        if (typeof loadTransactions === 'function') loadTransactions();
      }
    };
  }

  return { notifyDataChanged };
})();
