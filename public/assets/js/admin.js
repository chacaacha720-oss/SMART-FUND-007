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
    if (!username || !password) return showToast(I18N.t('admin.toast.requiredFields'), 'error');

    const btn = document.getElementById('adminLoginBtn');
    setBtnLoading(btn, true);
    const res = await api('/admin/auth/login', { method: 'POST', body: { username, password } });
    setBtnLoading(btn, false);

    if (res.success) {
      AdminToken.set(res.token, true);
      showToast(I18N.t('admin.toast.loginSuccess'), 'success');
      setTimeout(() => showAdminApp(res.data), 500);
    } else {
      showToast(res.message || I18N.t('admin.toast.loginFailed'), 'error');
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
  document.getElementById('adminRole').textContent = admin.role === 'super_admin' ? I18N.t('admin.role.super') : I18N.t('admin.role.admin');

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
      'cs-codes': I18N.t('admin.csCode'),
    telegram: I18N.t('admin.telegram'),
    settings: I18N.t('admin.settings'),
    promo: I18N.t('admin.promo'),
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

  // Show/hide super admin menu items
  const superAdminLinks = document.querySelectorAll('.super-admin-only');
  superAdminLinks.forEach((l) => {
    l.style.display = admin.role === 'super_admin' ? '' : 'none';
  });

  // Logout
  document.getElementById('adminLogoutBtn').addEventListener('click', async () => {
    const ok = await alertConfirm(I18N.t('admin.confirmLogout'), I18N.t('admin.confirmLogoutText'));
    if (ok) { AdminToken.clear(); window.location.href = `${BASE_PATH}/admin.html`; }
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

  // Super admin application filters
  const filterInputs = ['filterCsCode', 'filterStatus', 'filterUserId', 'filterStart', 'filterEnd'];
  filterInputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', loadApplications);
      if (id === 'filterCsCode' || id === 'filterUserId') {
        let timeout;
        el.addEventListener('input', () => { clearTimeout(timeout); timeout = setTimeout(loadApplications, 500); });
      }
    }
  });
  const clearBtn = document.getElementById('clearAppFilters');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    filterInputs.forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
    loadApplications();
  });

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
  if (page === 'withdrawals') await loadWithdrawals();
  if (page === 'cs-codes') await loadCsCodes();
  if (page === 'telegram') {
    await loadTelegramConfig();
    await loadTelegramLogs();
  }
  if (page === 'settings') await loadSettings();
  if (page === 'promo') await loadPromo();
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
    showToast(I18N.t('admin.toast.userUpdated'), 'success');
    closeUserModal();
    await loadUsers();
    // Notify other tab (user dashboard) that data has changed.
    AdminSync.notifyDataChanged();
  }
  else showToast(res.message || I18N.t('admin.noDataChanged'), 'error');
}

async function deleteUser(id) {
  const ok = await alertConfirm(I18N.t('admin.confirmDelete'), I18N.t('admin.confirmDeleteText'), I18N.t('admin.deleteUser'), I18N.t('admin.cancel'));
  if (!ok) return;
  const res = await api(`/admin/users/${id}`, { method: 'DELETE' });
    if (res.success) {     showToast(I18N.t('admin.toast.userDeleted'), 'success'); await loadUsers(); }
  else showToast(res.message || I18N.t('admin.noDataChanged'), 'error');
}

// ============================================
// APPLICATIONS
// ============================================
async function loadApplications() {
  // Show filters only for super admin
  const filterBar = document.getElementById('appFilters');
  if (filterBar) {
    filterBar.classList.toggle('hidden', currentAdmin.role !== 'super_admin');
  }

  // Build query params for super admin filters
  const params = new URLSearchParams();
  if (currentAdmin && currentAdmin.role === 'super_admin') {
    const ac = document.getElementById('filterCsCode')?.value.trim();
    const st = document.getElementById('filterStatus')?.value;
    const uid = document.getElementById('filterUserId')?.value.trim();
    const sd = document.getElementById('filterStart')?.value;
    const ed = document.getElementById('filterEnd')?.value;
    if (ac) params.append('cs_code', ac);
    if (st) params.append('status', st);
    if (uid) params.append('userId', uid);
    if (sd) params.append('start', sd);
    if (ed) params.append('end', ed);
  }

  const res = await api(`/admin/applications?${params.toString()}`);
  if (!res.success) return;
  const tbody = document.getElementById('appsTable');
  if (!res.data.length) { tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-400">${I18N.t('admin.noApplications')}</td></tr>`; return; }
  tbody.innerHTML = res.data.map((a) => `
    <tr class="table-row hover:bg-slate-50 dark:hover:bg-slate-800/30">
      <td class="px-4 py-3 font-semibold text-slate-700">#${a.id}</td>
      <td class="px-4 py-3 text-slate-700">${a.full_name}<div class="text-xs text-slate-400">${a.phone}</div></td>
       <td class="px-4 py-3 text-slate-700 font-mono text-sm">${a.cs_code || a.la_cs_code || '-'}</td>
      <td class="px-4 py-3 text-slate-700">${formatRupiah(a.amount)}</td>
      <td class="px-4 py-3 text-slate-700">${a.tenor} ${I18N.t('admin.month')}</td>
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
        <h4 class="font-bold text-slate-800 mb-3"><i class="fas fa-user text-blue-600 mr-2"></i> ${I18N.t('admin.detail.borrower')}</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">${I18N.t('admin.detail.name')}</span><span class="font-semibold">${a.full_name}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">${I18N.t('admin.detail.email')}</span><span class="font-semibold">${a.email}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">${I18N.t('admin.detail.phone')}</span><span class="font-semibold">${a.phone}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">${I18N.t('admin.detail.nik')}</span><span class="font-semibold">${a.nik || '-'}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">${I18N.t('admin.detail.address')}</span><span class="font-semibold text-right">${a.address || '-'}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">${I18N.t('admin.detail.job')}</span><span class="font-semibold">${a.job || '-'}</span></div>
        </div>
      </div>
      <div class="bg-blue-50 rounded-xl p-4">
        <h4 class="font-bold text-slate-800 mb-3"><i class="fas fa-money-bill-wave text-blue-600 mr-2"></i> ${I18N.t('admin.detail.loan')}</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">${I18N.t('admin.detail.amount')}</span><span class="font-bold">${formatRupiah(a.amount)}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">${I18N.t('admin.detail.tenor')}</span><span class="font-semibold">${a.tenor} ${I18N.t('admin.month')}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">${I18N.t('admin.detail.purpose')}</span><span class="font-semibold">${a.purpose}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">${I18N.t('admin.detail.monthly')}</span><span class="font-semibold">${formatRupiah(a.monthly_payment)}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">${I18N.t('admin.detail.totalInterest')}</span><span class="font-semibold">${formatRupiah(a.total_interest)}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">${I18N.t('admin.detail.totalPayment')}</span><span class="font-bold">${formatRupiah(a.total_payment)}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">${I18N.t('admin.detail.status')}</span>${statusBadge(a.status)}</div>
          <div class="flex justify-between"><span class="text-slate-500">${I18N.t('admin.detail.date')}</span><span class="font-semibold">${formatDateTime(a.created_at)}</span></div>
        </div>
      </div>
    </div>
    ${a.cs_code ? `<div class="bg-amber-50 rounded-xl p-4 text-sm"><b>${I18N.t('admin.csCode')}:</b> ${a.cs_code} | <b>${I18N.t('admin.csName')}:</b> ${a.cs_name || '-'}</div>` : ''}
    ${a.admin_note ? `<div class="bg-amber-50 rounded-xl p-4 text-sm"><b>${I18N.t('admin.detail.adminNote')}:</b> ${a.admin_note}</div>` : ''}
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
  const ok = await alertConfirm(I18N.t('admin.confirmAppStatus').replace('{id}', currentAppId), status === 'disbursed' ? I18N.t('admin.disburse') + ': ' + I18N.t('admin.confirmDisburseText') : '');
  if (!ok) return;
  const res = await api(`/admin/applications/${currentAppId}/status`, { method: 'PUT', body: { status, adminNote: note } });
  if (res.success) {
    const statusText = status === 'approved' ? I18N.t('status.approved') : status === 'rejected' ? I18N.t('status.rejected') : I18N.t('status.disbursed');
    showToast(`${I18N.t('admin.applications')} ${statusText}`, 'success');
    closeAppModal();
    await loadApplications();
    await loadAdminDashboard();
     // Notify user tab that application status has changed
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
   const ok = await alertConfirm(`${I18N.t(status === 'approved' ? 'admin.approve' : 'admin.reject')} ${I18N.t('admin.txConfirm')} #${id}?`, '');
  if (!ok) return;
  const res = await api(`/admin/transactions/${id}/status`, { method: 'PUT', body: { status } });
  if (res.success) {
    const statusText = { pending: I18N.t('admin.txStatus.pending'), approved: I18N.t('admin.txStatus.approved'), rejected: I18N.t('admin.txStatus.rejected'), completed: I18N.t('admin.txStatus.completed') };
   showToast(`${I18N.t('admin.transactions')} ${statusText[status] || status}`, 'success');
    await loadTransactions();
     // Notify user tab that transaction status has changed
     AdminSync.notifyDataChanged();
  }
  else showToast(res.message || I18N.t('admin.noDataChanged'), 'error');
}

// ============================================
// WITHDRAWALS
// ============================================
async function loadWithdrawals(search = '', filter = '') {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (filter) params.append('status', filter);
  const res = await api(`/admin/withdrawals?${params.toString()}`);
  const tbody = document.getElementById('withdrawTable');
  if (!tbody) return;
  if (!res.success || !res.data.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-400">${I18N.t('admin.noTransactions')}</td></tr>`;
    return;
  }
  const statusMap = {
    menunggu_verifikasi: { text: I18N.t('admin.withStatus.waiting'), cls: 'badge-pending' },
    diproses: { text: I18N.t('admin.withStatus.processing'), cls: 'badge-active' },
    berhasil: { text: I18N.t('admin.withStatus.success'), cls: 'badge-approved' },
    ditolak: { text: I18N.t('admin.withStatus.rejected'), cls: 'badge-rejected' },
  };
  tbody.innerHTML = res.data.map((w) => `
    <tr class="table-row hover:bg-slate-50 dark:hover:bg-slate-800/30">
      <td class="px-4 py-3 font-semibold text-slate-700">${w.withdrawal_id}</td>
      <td class="px-4 py-3 text-slate-700">${w.nama}</td>
      <td class="px-4 py-3 text-slate-500 text-sm">${w.email}</td>
      <td class="px-4 py-3 text-slate-700">${w.bank}</td>
      <td class="px-4 py-3 text-slate-700">${formatRupiah(w.jumlah)}</td>
      <td class="px-4 py-3"><span class="badge ${statusMap[w.status]?.cls || 'badge-pending'}">${statusMap[w.status]?.text || w.status}</span></td>
      <td class="px-4 py-3 text-slate-500 text-sm">${formatDate(w.created_at)}</td>
      <td class="px-4 py-3 space-x-1">
         <button onclick="viewWithdrawal('${w.withdrawal_id}')" class="text-blue-600 hover:bg-blue-50 p-1 rounded" title="${I18N.t('admin.viewApp')}"><i class="fas fa-eye"></i></button>
         ${w.status === 'menunggu_verifikasi' ? `
           <button onclick="updateWithdrawStatus('${w.withdrawal_id}', 'diproses')" class="text-amber-600 hover:bg-amber-50 p-1 rounded" title="${I18N.t('admin.process', 'Process')}"><i class="fas fa-cog"></i></button>
           <button onclick="updateWithdrawStatus('${w.withdrawal_id}', 'berhasil')" class="text-green-600 hover:bg-green-50 p-1 rounded" title="${I18N.t('admin.approve')}"><i class="fas fa-check"></i></button>
           <button onclick="updateWithdrawStatus('${w.withdrawal_id}', 'ditolak')" class="text-red-600 hover:bg-red-50 p-1 rounded" title="${I18N.t('admin.reject')}"><i class="fas fa-times"></i></button>
        ` : ''}
      </td>
    </tr>`).join('');
}

// Search & filter handlers
const wdSearch = document.getElementById('withdrawSearch');
if (wdSearch) {
  let wdTimeout;
  wdSearch.addEventListener('input', () => {
    clearTimeout(wdTimeout);
    wdTimeout = setTimeout(() => loadWithdrawals(wdSearch.value, document.getElementById('withdrawFilter')?.value || ''), 300);
  });
}
const wdFilter = document.getElementById('withdrawFilter');
if (wdFilter) {
  wdFilter.addEventListener('change', () => {
    loadWithdrawals(wdSearch?.value || '', wdFilter.value);
  });
}

async function viewWithdrawal(id) {
  const res = await api(`/admin/withdrawals/${id}`);
    if (!res.success) { showToast(res.message || I18N.t('admin.toast.withdrawLoadError'), 'error'); return; }
  const w = res.data;
  const statusLabels = {
    menunggu_verifikasi: I18N.t('admin.withStatus.waiting'),
    diproses: I18N.t('admin.withStatus.processing'),
    berhasil: I18N.t('admin.withStatus.success'),
    ditolak: I18N.t('admin.withStatus.rejected'),
  };
  Swal.fire({
     title: `${I18N.t('admin.withdrawDetail', 'Butiran Pengeluaran')} #${w.withdrawal_id}`,
    html: `
      <div class="text-left space-y-2 text-sm">
        <p><b>${I18N.t('admin.detail.name')}:</b> ${w.nama}</p>
        <p><b>${I18N.t('admin.detail.email')}:</b> ${w.email}</p>
        <p><b>${I18N.t('admin.detail.phone')}:</b> ${w.no_hp}</p>
        <p><b>${I18N.t('admin.detail.bank')}:</b> ${w.bank}</p>
        <p><b>${I18N.t('admin.detail.accountNumber')}:</b> ${w.no_rekening}</p>
        <p><b>${I18N.t('admin.detail.accountName')}:</b> ${w.nama_rekening}</p>
        <p><b>${I18N.t('admin.detail.amount')}:</b> ${formatRupiah(w.jumlah)}</p>
        <p><b>${I18N.t('admin.detail.status')}:</b> ${statusLabels[w.status] || w.status}</p>
        <p><b>${I18N.t('admin.detail.date')}:</b> ${formatDateTime(w.created_at)}</p>
        ${w.catatan ? `<p><b>${I18N.t('admin.detail.adminNote')}:</b> ${w.catatan}</p>` : ''}
      </div>`,
    confirmButtonText: I18N.t('admin.ok'),
  });
}

async function updateWithdrawStatus(id, status) {
   const statusLabel = { diproses: I18N.t('admin.withStatus.processing'), berhasil: I18N.t('admin.withStatus.success'), ditolak: I18N.t('admin.withStatus.rejected') };
   const ok = await alertConfirm(I18N.t('admin.confirmWithdrawStatus').replace('{status}', statusLabel[status]).replace('{id}', id), '');
  if (!ok) return;

  let note = '';
  if (status === 'ditolak') {
    const noteRes = await Swal.fire({
      input: 'textarea',
       inputLabel: I18N.t('admin.form.reason'),
      showCancelButton: true,
      cancelButtonText: I18N.t('admin.cancel'),
    });
    if (!noteRes.isConfirmed) return;
    note = noteRes.value || '';
  }

  const res = await api(`/admin/withdrawals/${id}/status`, { method: 'PUT', body: { status, catatan: note } });
  if (res.success) {
     showToast(I18N.t('admin.toast.withdrawStatusUpdated').replace('{id}', id), 'success');
    await loadWithdrawals();
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
    showToast(I18N.t('admin.tg.tokenRequired'), 'error');
    return;
  }

  const btn = document.getElementById('tgSaveBtn');
  setBtnLoading(btn, true);
  const res = await api('/admin/settings', { method: 'PUT', body: { settings } });
  setBtnLoading(btn, false);

  if (res.success) {
    showToast(I18N.t('admin.tg.saved'), 'success');
    await loadTelegramLogs();
  } else {
    showToast(res.message || I18N.t('admin.noDataChanged'), 'error');
  }
}

async function loadTelegramLogs() {
  const res = await api('/admin/telegram/logs');
  if (!res.success) return;
  const el = document.getElementById('tgLogs');
  if (!res.data.length) { el.innerHTML = `<p class="text-center text-slate-400 py-4">${I18N.t('admin.tg.emptyLogs')}</p>`; return; }
  el.innerHTML = res.data.slice(0, 20).map((l) => `
    <div class="p-3 ${l.status === 'sent' ? 'bg-green-50' : 'bg-red-50'} rounded-xl text-sm">
      <div class="flex justify-between mb-1">
        <span class="font-semibold ${l.status === 'sent' ? 'text-green-700' : 'text-red-700'}">${l.status === 'sent' ? I18N.t('admin.tg.sent') : I18N.t('admin.tg.failed')}</span>
        <span class="text-xs text-slate-400">${formatDateTime(l.created_at)}</span>
      </div>
      <p class="text-slate-600 text-xs truncate">${l.message.substring(0, 80)}...</p>
    </div>`).join('');
}

async function testTelegram() {
  const res = await api('/admin/telegram/test', { method: 'POST' });
  if (res.success) { showToast(I18N.t('admin.tg.testSent'), 'success'); await loadTelegramLogs(); }
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
  if (res.success) showToast(I18N.t('admin.set.saved'), 'success');
  else showToast(res.message || I18N.t('admin.noDataChanged'), 'error');
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
  if (res.success) showToast(I18N.t('admin.set.saved'), 'success');
  else showToast(res.message || I18N.t('admin.noDataChanged'), 'error');
}

// ============================================
// PROMO BANNER MANAGEMENT
// ============================================
async function loadPromo() {
  const listEl = document.getElementById('promoList');
  if (!listEl) return;
  listEl.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">${I18N.t('admin.loading')}</td></tr>`;
  const res = await api('/admin/banners');
  if (!res.success || !res.data) {
    listEl.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">${I18N.t('admin.loadError')}</td></tr>`;
    return;
  }
  if (!res.data.length) {
    listEl.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">${I18N.t('admin.promoEmpty')}</td></tr>`;
    return;
  }
  listEl.innerHTML = res.data.map((b) => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="py-3 px-3 font-mono text-sm text-slate-700">${b.id}</td>
      <td class="py-3 px-3">
        <div class="font-semibold text-slate-900">${b.title}</div>
        <div class="text-sm text-slate-500">${b.subtitle || '-'}</div>
      </td>
      <td class="py-3 px-3">
        ${b.video_url
          ? `<video src="${b.video_url}" muted controls class="w-16 h-10 object-cover rounded-lg bg-slate-100"></video>`
          : `<img src="${b.image_url}" alt="" class="w-16 h-10 object-cover rounded-lg" onerror="this.style.display='none'" />`}
      </td>
      <td class="py-3 px-3 text-center">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${b.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
          ${b.active ? I18N.t('admin.promoStatusActive') : I18N.t('admin.promoStatusInactive')}
        </span>
      </td>
      <td class="py-3 px-3 text-center text-sm text-slate-600">${b.order || 0}</td>
      <td class="py-3 px-3 text-center">
        <div class="flex items-center justify-center gap-2">
          <button onclick="editPromo('${b.id}')" class="text-blue-600 hover:text-blue-800 p-1" title="${I18N.t('admin.promoEdit')}"><i class="fas fa-edit"></i></button>
          <button onclick="deletePromo('${b.id}')" class="text-red-600 hover:text-red-800 p-1" title="${I18N.t('admin.promoDelete')}"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

let promoEditId = null;

function editPromo(id) {
  promoEditId = id;
  const form = document.getElementById('promoForm');
  const title = document.getElementById('promoTitle');
  const subtitle = document.getElementById('promoSubtitle');
  const image = document.getElementById('promoImage');
  const video = document.getElementById('promoVideo');
  const link = document.getElementById('promoLink');
  const active = document.getElementById('promoActive');
  const order = document.getElementById('promoOrder');
  const hiddenId = document.getElementById('promoId');

  // Find the banner data
  const rows = document.querySelectorAll('#promoList tr');
  let bannerData = null;
  document.querySelectorAll('#promoList tr').forEach(row => {
    if (row.querySelector('td:first-child')?.textContent === id) {
      const titleCell = row.querySelector('td:nth-child(2)');
      const img = row.querySelector('td:nth-child(3) img');
      const activeCell = row.querySelector('td:nth-child(4)');
      const orderCell = row.querySelector('td:nth-child(5)');
      if (titleCell) {
        const fullTitle = titleCell.querySelector('.font-semibold')?.textContent || '';
        const sub = titleCell.querySelector('div:last-child')?.textContent || '';
        title.value = fullTitle;
        subtitle.value = sub === '-' ? '' : sub;
      }
      if (img) image.value = img.src;
      active.value = activeCell.querySelector('span')?.textContent?.includes('Aktif') ? 'true' : 'false';
      if (orderCell) order.value = orderCell.textContent.trim() || 0;
      hiddenId.value = id;
    }
  });

  // Try to fetch the exact banner data from API for accuracy
  api('/admin/banners').then(res => {
    if (res.success && res.data) {
      const banner = res.data.find(b => b.id === id);
      if (banner) {
        title.value = banner.title;
        subtitle.value = banner.subtitle || '';
        image.value = banner.image_url;
        video.value = banner.video_url || '';
        link.value = banner.link_url || '';
        active.value = banner.active ? 'true' : 'false';
        order.value = banner.order || 0;
        hiddenId.value = banner.id;
        const preview = document.getElementById('promoImagePreview');
        if (preview) {
          if (banner.image_url) { preview.src = banner.image_url; preview.classList.remove('hidden'); }
          else { preview.src = ''; preview.classList.add('hidden'); }
        }
        const videoPreview = document.getElementById('promoVideoPreview');
        if (videoPreview) {
          if (banner.video_url) { videoPreview.src = banner.video_url; videoPreview.classList.remove('hidden'); }
          else { videoPreview.removeAttribute('src'); videoPreview.classList.add('hidden'); }
        }
      }
    }
  });

  // Update form button text
  const btn = document.querySelector('#promoForm button[type="submit"] .btn-text');
  if (btn) btn.innerHTML = `<i class="fas fa-save mr-2"></i> ${I18N.t('admin.promoEdit')}`;
  form.scrollIntoView({ behavior: 'smooth' });
}

async function savePromo(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    title: document.getElementById('promoTitle').value.trim(),
    subtitle: document.getElementById('promoSubtitle').value.trim(),
    image_url: document.getElementById('promoImage').value.trim(),
    video_url: document.getElementById('promoVideo').value.trim(),
    link_url: document.getElementById('promoLink').value.trim(),
    active: document.getElementById('promoActive').value === 'true',
    order: parseInt(document.getElementById('promoOrder').value) || 0,
  };

  if (!data.title || (!data.image_url && !data.video_url)) {
    showToast(I18N.t('admin.promoTitleRequired') || 'Title and image or video are required', 'error');
    return;
  }

  const id = document.getElementById('promoId').value;
  const isEdit = !!promoEditId;

  const endpoint = isEdit ? `/admin/banners/${promoEditId}` : '/admin/banners';
  const method = isEdit ? 'PUT' : 'POST';

  const btn = form.querySelector('button[type="submit"]');
  setBtnLoading(btn, true);
  const res = await api(endpoint, { method, body: data });
  setBtnLoading(btn, false);

  if (res.success) {
    showToast(res.message || (isEdit ? I18N.t('admin.promoUpdated') : I18N.t('admin.promoCreated')), 'success');
    resetPromoForm();
    await loadPromo();
  } else {
    showToast(res.message || I18N.t('admin.noDataChanged'), 'error');
  }
}

function resetPromoForm() {
  const form = document.getElementById('promoForm');
  form.reset();
  document.getElementById('promoId').value = '';
  promoEditId = null;
  const btn = document.querySelector('#promoForm button[type="submit"] .btn-text');
  if (btn) btn.innerHTML = `<i class="fas fa-save mr-2"></i> ${I18N.t('admin.promoCreate')}`;
  const preview = document.getElementById('promoImagePreview');
  if (preview) { preview.src = ''; preview.classList.add('hidden'); }
  const videoPreview = document.getElementById('promoVideoPreview');
  if (videoPreview) { videoPreview.removeAttribute('src'); videoPreview.classList.add('hidden'); }
  const status = document.getElementById('promoImageStatus');
  if (status) status.textContent = '';
}

async function deletePromo(id) {
  const ok = await alertConfirm(I18N.t('admin.promoDeleteConfirm'), I18N.t('admin.promoDeleteConfirmText'));
  if (!ok) return;
  const res = await api(`/admin/banners/${id}`, { method: 'DELETE' });
  if (res.success) {
    showToast(res.message || I18N.t('admin.promoDeleted'), 'success');
    await loadPromo();
  } else {
    showToast(res.message || I18N.t('admin.promoNotFound'), 'error');
  }
}

// Cancel button handler
document.addEventListener('DOMContentLoaded', () => {
  const cancelBtn = document.getElementById('promoCancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', resetPromoForm);
  }
  const promoForm = document.getElementById('promoForm');
  if (promoForm) {
    promoForm.addEventListener('submit', savePromo);
  }

  // Banner video URL live preview
  const promoVideo = document.getElementById('promoVideo');
  const promoVideoPreview = document.getElementById('promoVideoPreview');
  if (promoVideo && promoVideoPreview) {
    promoVideo.addEventListener('input', () => {
      const url = promoVideo.value.trim();
      if (url) { promoVideoPreview.src = url; promoVideoPreview.classList.remove('hidden'); }
      else { promoVideoPreview.removeAttribute('src'); promoVideoPreview.classList.add('hidden'); }
    });
  }

  // Banner image upload
  const promoImageUploadBtn = document.getElementById('promoImageUploadBtn');
  const promoImageFile = document.getElementById('promoImageFile');
  if (promoImageUploadBtn && promoImageFile) {
    promoImageUploadBtn.addEventListener('click', () => promoImageFile.click());
    promoImageFile.addEventListener('change', async () => {
      const file = promoImageFile.files && promoImageFile.files[0];
      if (!file) return;
      const status = document.getElementById('promoImageStatus');
      const preview = document.getElementById('promoImagePreview');
      status.textContent = 'Memuat naik...';
      status.className = 'text-xs text-slate-500';
      try {
        const fd = new FormData();
        fd.append('image', file);
        const res = await api('/admin/banners/upload', { method: 'POST', body: fd });
        if (res.success && res.url) {
          document.getElementById('promoImage').value = res.url;
          if (preview) { preview.src = res.url; preview.classList.remove('hidden'); }
          status.textContent = 'Berjaya';
          status.className = 'text-xs text-green-600';
        } else {
          status.textContent = res.message || 'Gagal memuat naik';
          status.className = 'text-xs text-red-600';
        }
      } catch (err) {
        status.textContent = 'Ralat sambungan';
        status.className = 'text-xs text-red-600';
      }
      promoImageFile.value = '';
    });
  }
});

// ============================================
// REAL-TIME SYNC - Admin <-> User Dashboard
// Using BroadcastChannel so changes made by
// admin appear immediately on the user dashboard
// without manual refresh.
// ============================================
const AdminSync = (() => {
  let channel = null;
  let channelError = false;

  // Daftar BroadcastChannel (fallback ke polling jika gagal)
  try {
    channel = new BroadcastChannel('smartfund_sync');
  } catch (e) {
    channelError = true;
  }

  /**
   * Notify other tab (user dashboard) that data has changed.
   * Called after admin changes balance, status, applications, transactions.
   */
  function notifyDataChanged() {
    if (channel && !channelError) {
      try { channel.postMessage({ type: 'data_changed', source: 'admin' }); } catch (e) { /* ignore */ }
    }
  }

  // Receive messages from user tab (e.g. user submits loan/withdrawal)
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

// ============================================
// CS CODE MANAGEMENT
// ============================================
async function loadCsCodes() {
  const tbody = document.getElementById('csTable');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">${I18N.t('admin.loading')}</td></tr>`;
  const res = await api('/admin/cs-codes');
  if (!res.success || !res.data) { tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">${I18N.t('admin.loadError')}</td></tr>`; return; }
  tbody.innerHTML = res.data.map((a) => `
    <tr class="table-row hover:bg-slate-50">
      <td class="px-4 py-3 font-mono text-sm text-slate-700">${a.cs_code || '-'}</td>
      <td class="px-4 py-3 text-slate-700">${a.full_name || '-'}</td>
      <td class="px-4 py-3 text-slate-500 text-sm">${a.email || '-'}</td>
      <td class="px-4 py-3">${a.role === 'super_admin' ? I18N.t('admin.role.super') : I18N.t('admin.role.admin')}</td>
      <td class="px-4 py-3">${a.status === 'active' ? '<span class="badge badge-active">' + I18N.t('status.active') + '</span>' : '<span class="badge badge-inactive">' + I18N.t('admin.csInactive') + '</span>'}</td>
      <td class="px-4 py-3">
        <button onclick="editCsCode(${a.id})" class="text-blue-600 hover:bg-blue-50 p-1 rounded" title="${I18N.t('admin.editUser')}"><i class="fas fa-pen"></i></button>
        <button onclick="deleteCsCode(${a.id})" class="text-red-600 hover:bg-red-50 p-1 rounded" title="${I18N.t('admin.deleteUser')}"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

async function editCsCode(id) {
  const res = await api(`/admin/cs-codes/${id}`);
  if (!res.success) return showToast(res.message || I18N.t('admin.loadError'), 'error');
  const a = res.data;
  const name = await promptAsync(I18N.t('admin.cs.createName'), a.full_name || '');
  if (name === null) return;
  const status = confirm(I18N.t('admin.cs.statusPrompt')) ? 'inactive' : 'active';
  const r = await api(`/admin/cs-codes/${id}`, { method: 'PUT', body: { fullName: name, status } });
  if (r.success) { showToast(I18N.t('admin.csUpdated'), 'success'); await loadCsCodes(); }
  else showToast(r.message || I18N.t('admin.cs.updateError'), 'error');
}

async function deleteCsCode(id) {
  const ok = await alertConfirm(I18N.t('admin.cs.deleteConfirm'), I18N.t('admin.cs.deleteConfirmText'));
  if (!ok) return;
  const res = await api(`/admin/cs-codes/${id}`, { method: 'DELETE' });
  if (res.success) { showToast(I18N.t('admin.csDeleted'), 'success'); await loadCsCodes(); }
  else showToast(res.message || I18N.t('admin.cs.deleteError'), 'error');
}

document.getElementById('btnCreateCs')?.addEventListener('click', async () => {
  const username = await promptAsync(I18N.t('admin.cs.createUsername'), I18N.t('admin.cs.defaultUsername'));
  if (!username) return;
  const email = await promptAsync(I18N.t('admin.cs.createEmail'), I18N.t('admin.cs.defaultEmail'));
  if (!email) return;
  const password = await promptAsync(I18N.t('admin.cs.createPassword'), I18N.t('admin.cs.defaultPassword'));
  if (!password) return;
  const fullName = await promptAsync(I18N.t('admin.cs.createName'), I18N.t('admin.cs.defaultFullName'));
  if (!fullName) return;
  const res = await api('/admin/cs-codes', { method: 'POST', body: { username, email, password, fullName } });
  if (res.success) { showToast(I18N.t('admin.csCreated') + ` (CS: ${res.data.cs_code})`, 'success'); await loadCsCodes(); }
  else showToast(res.message || I18N.t('admin.cs.createError'), 'error');
});
