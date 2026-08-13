/**
 * SMART FUND - Backend Internationalization (i18n)
 * Supports: Malaysia (ms), English (en)
 *
 * Each language has its own:
 * - Locale code (ms-MY, en-US)
 * - Currency code (MYR, USD)
 * - Currency symbol (RM, $)
 * - Number format (1.000 vs 1,000)
 * - Date format (31 Desember 2026 vs December 31, 2026)
 * - Financial terminology
 *
 * NO currency conversion is performed.
 * The same numeric value is simply formatted per locale.
 */

// ============================================
// LOCALE CONFIGURATION
// ============================================
const LOCALE_CONFIG = {
  ms: {
    locale: 'ms-MY',
    currency: 'MYR',
    symbol: 'RM',
    label: 'Bahasa Malaysia',
  },
  en: {
    locale: 'en-US',
    currency: 'USD',
    symbol: '$',
    label: 'English',
  },
};

// ============================================
// TRANSLATIONS
// ============================================
const MESSAGES = {
  ms: {
    // ===== Auth =====
    'auth.tokenNotFound': 'Token tidak dijumpai. Sila log masuk.',
    'auth.notUser': 'Akses dinafikan. Bukan akun pengguna.',
    'auth.userNotFound': 'Pengguna tidak dijumpai.',
    'auth.accountFrozen': 'Akun anda dibekukan. Hubungi admin.',
    'auth.tokenInvalid': 'Token tidak sah atau tamat jangka waktu.',
    'auth.adminTokenNotFound': 'Token admin tidak dijumpai.',
    'auth.notAdmin': 'Akses dinafikan. Bukan admin.',
    'auth.adminNotFound': 'Admin tidak dijumpai.',
    'auth.adminInactive': 'Akun admin tidak aktif.',
    'auth.adminTokenInvalid': 'Token admin tidak sah atau tamat jangka waktu.',

    // ===== Auth Controller =====
    'auth.emailExists': 'Emel sudah berdaftar',
    'auth.registerSuccess': 'Pendaftaran berjaya. Anda auto log masuk.',
    'auth.welcomeNotif': 'Selamat Datang ke SMART FUND!',
    'auth.welcomeMsg': (name) => `Halo ${name}, akun anda berjaya dibuat. Nikmati pelbagai kemudahan pinjaman dalam talian bersama kami.`,
    'auth.loginSuccess': 'Log masuk berjaya',
    'auth.loginFailed': 'Emel/Nombor HP atau kata laluan salah',
    'auth.accountFrozenLogin': 'Akun anda dibekukan. Hubungi admin.',
    'auth.identifierRequired': 'Emel atau nombor HP diperlukan',
    'auth.accountNotFound': 'Akun tidak dijumpai',
    'auth.otpSent': 'OTP telah dikirim ke emel & SMS anda',
    'auth.emailOtpRequired': 'Emel dan OTP diperlukan',
    'auth.otpInvalid': 'OTP tidak sah atau tamat jangka waktu',
    'auth.otpValid': 'OTP sah',
    'auth.tokenPasswordRequired': 'Token dan kata laluan baru diperlukan',
    'auth.passwordMin': 'Kata laluan minimum 6 karakter',
    'auth.resetTokenInvalid': 'Token tidak sah atau tamat jangka waktu',
    'auth.passwordChanged': 'Kata laluan berjaya diubah. Sila log masuk.',
    'auth.userNotFound404': 'Pengguna tidak dijumpai',
    'auth.adminCodeInvalid': 'Kod admin tidak sah',
    'auth.adminCodeNotFound': 'Kod admin tidak dijumpai',
    'auth.adminInactive': 'Akun admin tidak aktif.',
    'auth.csCodeInvalid': 'Kod CS tidak sah. Format: CS01',
    'auth.csCodeNotFound': 'Kod CS tidak dijumpai',
    'auth.csInactive': 'Akun CS tidak aktif',

    // ===== Admin Auth =====
    'admin.userPassRequired': 'Nama pengguna dan kata laluan diperlukan',
    'admin.loginFailed': 'Nama pengguna atau kata laluan salah',
    'admin.inactive': 'Akun admin tidak aktif',
    'admin.loginSuccess': 'Log masuk admin berjaya',

    // ===== Loan Controller =====
    'loan.amountRange': 'Jumlah pinjaman harus RM500 - RM300,000',
    'loan.tenorRange': 'Jangka waktu harus 6 - 60 bulan',
    'loan.purposeRequired': 'Tujuan pinjaman diperlukan',
    'loan.userNotFound': 'Pengguna tidak dijumpai',
    'loan.accountFrozen': 'Akun dibekukan. Tidak boleh memohon pinjaman.',
    'loan.exceedLimit': (limit) => `Jumlah melebihi had pinjaman anda (RM${Number(limit).toLocaleString('ms-MY')})`,
    'loan.hasActiveLoan': 'Anda masih mempunyai pinjaman aktif. Selesaikan dahulu.',
    'loan.applySuccess': 'Permohonan berjaya dikirim. Status: Menunggu Kelulusan.',
    'loan.notFound': 'Pinjaman tidak dijumpai',
    'loan.notifTitle': 'Permohonan Pinjaman Diterima',
    'loan.notifMsg': (id, amount) => `Permohonan pinjaman #${id} sebanyak RM${Number(amount).toLocaleString('ms-MY')} telah diterima dan sedang menunggu kelulusan admin.`,

    // ===== User Controller =====
    'user.notFound': 'Pengguna tidak dijumpai',
    'user.minWithdraw': 'Jumlah pengeluaran minimum adalah RM100,000',
    'user.withdrawDataRequired': 'Semua data akun bank wajib diisi',
    'user.notActiveWithdraw': 'Akun Anda belum aktif untuk melakukan pengeluaran',
    'user.exceedBalance': 'Jumlah pengeluaran melebihi saldo tersedia',
    'user.withdrawSuccess': 'Permintaan pengeluaran berhasil dikirim. Silakan melakukan verifikasi KYC melalui admin.',
    'user.withdrawNotifTitle': 'Permintaan Pengeluaran Diterima',
    'user.withdrawNotifMsg': (amount) => `Permintaan pengeluaran sebanyak RM${Number(amount).toLocaleString('ms-MY')} sedang menunggu verifikasi admin.`,
    'user.withdrawDesc': (bank) => `Permintaan pengeluaran ke ${bank}`,
    'user.notifRead': 'Notifikasi dibaca',
    'user.noDataChanged': 'Tiada data diubah',
    'user.profileUpdated': 'Profil berjaya diperbarui',
    'user.passwordRequired': 'Kata laluan lama dan baru diperlukan',
    'user.newPasswordMin': 'Kata laluan baharu minimum 6 karakter',
    'user.oldPasswordWrong': 'Kata laluan lama salah',
    'user.passwordChanged': 'Kata laluan berjaya diubah',
    'user.fileNotFound': 'Fail tidak dijumpai',
    'user.docUploaded': 'Dokumen berjaya dimuat naik',

    // ===== Withdrawal Controller =====
    'withdraw.allFieldsRequired': 'Semua medan wajib diisi',
    'withdraw.invalidAmount': 'Jumlah pengeluaran harus nombor positif',
    'withdraw.minAmount': (amount) => `Jumlah pengeluaran minimum ialah RM${Number(amount).toLocaleString('ms-MY')}`,
    'withdraw.invalidAccount': 'Nombor akun hanya boleh mengandungi angka',
    'withdraw.insufficientBalance': 'Baki tidak mencukupi untuk pengeluaran',
    'withdraw.notFound': 'Pengeluaran tidak dijumpai',
    'withdraw.invalidStatus': 'Status tidak sah',
    'withdraw.success': 'Permintaan pengeluaran berjaya diajukan',
    'withdraw.statusUpdated': 'Status pengeluaran berjaya diperbarui',
    'withdraw.processed': 'Diproses',
    'withdraw.processedMsg': (id) => `Pengeluaran ${id} sedang diproses`,
    'withdraw.successMsg': (id) => `Pengeluaran ${id} berjaya diproses`,
    'withdraw.rejected': 'Ditolak',
    'withdraw.rejectedMsg': (id, note) => `Pengeluaran ${id} ditolak. ${note || ''}`,
    'withdraw.pending': 'Menunggu Verifikasi',
    'withdraw.pendingMsg': (id) => `Pengeluaran ${id} menunggu verifikasi`,
    'withdraw.notifTitle': 'Permintaan Pengeluaran Diterima',
    'withdraw.notifMsg': (id) => `Pengeluaran ${id} sedang menunggu verifikasi`,

    // ===== Admin Controller =====
    'admin.statusInvalid': 'Status tidak sah',
    'admin.noDataChanged': 'Tiada data diubah',
    'admin.userUpdated': 'Pengguna berjaya diperbarui',
    'admin.balanceNotifTitle': 'Baki Diperbarui',
    'admin.balanceNotifMsg': (balance) => `Baki anda telah diperbarui oleh admin kepada RM${Number(balance).toLocaleString('ms-MY')}`,
    'admin.userStatusNotifTitle': 'Status Akun',
    'admin.userStatusNotifMsg': (label) => `Akun anda telah ${label} oleh admin.`,
    'admin.frozen': 'dibekukan',
    'admin.activated': 'diaktifkan',
    'admin.changed': 'diubah',
    'admin.userStatusSuccess': (label) => `Pengguna berjaya ${label}`,
    'admin.userDeleted': 'Pengguna berjaya dipadam',
    'admin.appNotFound': 'Permohonan tidak dijumpai',
    'admin.appUpdated': 'Permohonan berjaya diperbarui',
    'admin.appStatusSuccess': (status) => `Status permohonan: ${status}`,
    'admin.approvedNotifTitle': 'Pinjaman Diluluskan',
    'admin.approvedNotifMsg': (id) => `Permohonan pinjaman #${id} anda telah diluluskan. Dana akan segera dicairkan.`,
    'admin.rejectedNotifTitle': 'Pinjaman Ditolak',
    'admin.rejectedNotifMsg': (id, reason) => `Permohonan pinjaman #${id} ditolak. Sebab: ${reason}`,
    'admin.defaultRejectReason': 'Tidak memenuhi kriteria',
    'admin.disbursedNotifTitle': 'Dana Dicairkan',
    'admin.disbursedNotifMsg': (id, amount) => `Pinjaman #${id} sebanyak RM${Number(amount).toLocaleString('ms-MY')} telah dicairkan ke baki anda.`,
    'admin.disbursementDesc': 'Pencairan pinjaman',
    'admin.completedNotifTitle': 'Pinjaman Lunas',
    'admin.completedNotifMsg': (id) => `Pinjaman #${id} telah lunas. Terima kasih.`,
    'admin.txNotFound': 'Transaksi tidak dijumpai',
    'admin.txStatusSuccess': (status) => `Status transaksi: ${status}`,
    'admin.txStatusNotifTitle': 'Status Transaksi',
    'admin.txStatusNotifMsg': (id, type, status) => `Transaksi #${id} (${type}) status: ${status}.`,
    'admin.settingsSaved': 'Tetapan berjaya disimpan',
    'admin.telegramTestSuccess': 'Test telegram berjaya dikirim',
    'admin.telegramTestFailed': 'Gagal menghantar test telegram. Semak konfigurasi bot.',

    // ===== Validation =====
    'val.nameRequired': 'Nama penuh diperlukan',
    'val.nameMin': 'Nama penuh minimum 3 karakter',
    'val.emailInvalid': 'Emel tidak sah',
    'val.phoneInvalid': 'Nombor HP tidak sah',
    'val.passwordWeak': 'Kata laluan minimum 6 karakter, mengandungi huruf & nombor',
    'val.passwordMatch': 'Sahkan kata laluan tidak sepadan',
    'val.identifierRequired': 'Emel/Nombor HP diperlukan',
    'val.passwordRequired': 'Kata laluan diperlukan',
    'val.amountRange': 'Jumlah pinjaman harus RM500 - RM300,000',
    'val.tenorRange': 'Tempoh harus 6 - 60 bulan',
    'val.purposeRequired': 'Tujuan pinjaman diperlukan',
    'val.adminCodeRequired': 'Kod admin diperlukan',
    'val.adminCodeInvalid': 'Format kod admin tidak sah',
    'val.csCodeInvalid': 'Format kod CS tidak sah',

    // ===== Admin Code =====
    'admin.noAdminCode': 'Anda belum berdaftar dengan kod admin. Hubungi admin untuk mendapatkan kod pendaftaran.',
    'admin.codeNotFound': 'Kod admin tidak dijumpai',

    // ===== Error Handler =====
    'error.notFound': 'Endpoint tidak dijumpai',
    'error.fileSize': 'Saiz fail maksimum 5MB',
    'error.fileImage': 'Hanya fail imej (JPG/PNG) yang dibenarkan',
    'error.server': 'Berlaku ralat pelayan',
    'error.tooManyRequests': 'Terlalu banyak permintaan. Cuba lagi nanti.',
    'error.invalidJson': 'Format JSON tidak sah',

    // ===== Health =====
    'health.running': 'SMART FUND API berjalan',

    // ===== Telegram =====
    'telegram.newLoanTitle': 'PERMOHONAN PINJAMAN BARU',
    'telegram.borrowerData': 'Data Peminjam',
    'telegram.name': 'Nama',
    'telegram.phone': 'No. HP',
    'telegram.email': 'Emel',
    'telegram.adminData': 'Data Admin',
    'telegram.adminCode': 'Kod Admin',
    'telegram.adminName': 'Nama Admin',
    'telegram.loanDetail': 'Detail Pinjaman',
    'telegram.amount': 'Jumlah',
    'telegram.tenor': 'Tempoh',
    'telegram.month': 'bulan',
    'telegram.purpose': 'Tujuan',
    'telegram.calculation': 'Pengiraan',
    'telegram.monthly': 'Ansuran/Bulan',
    'telegram.totalInterest': 'Jumlah Bunga',
    'telegram.totalPayment': 'Jumlah Bayar',
    'telegram.time': 'Waktu',
    'telegram.verifyPrompt': 'Segera sahkan dan proses permohonan ini melalui dashboard admin.',
    'telegram.viewDashboard': '📊 Lihat Dashboard Admin',
    'telegram.chatUser': '💬 Chat Pengguna',
    'telegram.welcomeChat': (name) => `Halo ${name}, terima kasih telah memohon pinjaman di SMART FUND. Ada yang boleh kami bantu?`,
    'telegram.testMessage': '✅ <b>Test Notifikasi SMART FUND</b>\n\nNotifikasi Telegram berfungsi dengan baik.',
    'telegram.newWithdrawalTitle': 'PENGELUARAN BARU',

    // ===== CS Code =====
    'cs.title': 'Kod CS',
    'cs.myCode': 'Kod CS Anda',
    'cs.placeholder': 'Masukkan kod CS',
    'cs.copySuccess': 'Berjaya menyalin kod CS',
    'cs.noCsCode': 'Anda belum mempunyai kod CS',
    'telegram.csData': 'Data CS',
    'telegram.csCode': 'Kod CS',
    'telegram.csName': 'Nama CS',

    // ===== Admin CS =====
    'admin.csManagement': 'Kelola Kod CS',
    'admin.csList': 'Senarai Kod CS',
    'admin.csCode': 'Kod CS',
    'admin.csName': 'Nama CS',
    'admin.csStatus': 'Status CS',
    'admin.csCreate': 'Buat Kod CS',
    'admin.csCreated': 'Kod CS berjaya dibuat',
    'admin.csUpdated': 'Kod CS berjaya diperbarui',
    'admin.csDeleted': 'Kod CS berjaya dihapus',
    'admin.csNotFound': 'Kod CS tidak dijumpai',
    'admin.csActive': 'Aktif',
    'admin.csInactive': 'Tidak Aktif',
    'admin.superAdminOnly': 'Hanya Super Admin yang boleh melakukan ini',

    // ===== Status Labels =====
    'status.pending': 'Menunggu',
    'status.approved': 'Diluluskan',
    'status.disbursed': 'Dana Cair',
    'status.rejected': 'Ditolak',
    'status.completed': 'Lunas',
    'status.active': 'Aktif',
    'status.frozen': 'Dibekukan',
  },

  en: {
    // ===== Auth =====
    'auth.tokenNotFound': 'Token not found. Please login.',
    'auth.notUser': 'Access denied. Not a user account.',
    'auth.userNotFound': 'User not found.',
    'auth.accountFrozen': 'Your account is frozen. Contact admin.',
    'auth.tokenInvalid': 'Token is invalid or expired.',
    'auth.adminTokenNotFound': 'Admin token not found.',
    'auth.notAdmin': 'Access denied. Not an admin.',
    'auth.adminNotFound': 'Admin not found.',
    'auth.adminInactive': 'Admin account is inactive.',
    'auth.adminTokenInvalid': 'Admin token is invalid or expired.',

    // ===== Auth Controller =====
    'auth.emailExists': 'Email is already registered',
    'auth.registerSuccess': 'Registration successful. You are automatically logged in.',
    'auth.welcomeNotif': 'Welcome to SMART FUND!',
    'auth.welcomeMsg': (name) => `Hello ${name}, your account has been created successfully. Enjoy easy online loans with us.`,
    'auth.loginSuccess': 'Login successful',
    'auth.loginFailed': 'Email/Phone number or password is incorrect',
    'auth.accountFrozenLogin': 'Your account is frozen. Contact admin.',
    'auth.identifierRequired': 'Email or phone number is required',
    'auth.accountNotFound': 'Account not found',
    'auth.otpSent': 'OTP has been sent to your email & SMS',
    'auth.emailOtpRequired': 'Email and OTP are required',
    'auth.otpInvalid': 'OTP is invalid or expired',
    'auth.otpValid': 'OTP is valid',
    'auth.tokenPasswordRequired': 'Token and new password are required',
    'auth.passwordMin': 'Password must be at least 6 characters',
    'auth.resetTokenInvalid': 'Token is invalid or expired',
    'auth.passwordChanged': 'Password changed successfully. Please login.',
    'auth.userNotFound404': 'User not found',
    'auth.adminCodeInvalid': 'Invalid admin code',
    'auth.adminCodeNotFound': 'Admin code not found',
    'auth.adminInactive': 'Admin account is inactive.',
    'auth.csCodeInvalid': 'CS code invalid. Format: CS01',
    'auth.csCodeNotFound': 'CS code not found',
    'auth.csInactive': 'CS account is inactive',

    // ===== Admin Auth =====
    'admin.userPassRequired': 'Username and password are required',
    'admin.loginFailed': 'Username or password is incorrect',
    'admin.inactive': 'Admin account is inactive',
    'admin.loginSuccess': 'Admin login successful',

    // ===== Loan Controller =====
    'loan.amountRange': 'Loan amount must be RM500 - RM300,000',
    'loan.tenorRange': 'Tenor must be 6 - 60 months',
    'loan.purposeRequired': 'Loan purpose is required',
    'loan.userNotFound': 'User not found',
    'loan.accountFrozen': 'Account is frozen. Cannot apply for a loan.',
    'loan.exceedLimit': (limit) => `Amount exceeds your loan limit ($${Number(limit).toLocaleString('en-US')})`,
    'loan.hasActiveLoan': 'You still have an active loan. Please complete it first.',
    'loan.applySuccess': 'Application submitted successfully. Status: Pending Approval.',
    'loan.notFound': 'Loan not found',
    'loan.notifTitle': 'Loan Application Received',
    'loan.notifMsg': (id, amount) => `Loan application #${id} for $${Number(amount).toLocaleString('en-US')} has been received and is pending admin approval.`,

    // ===== User Controller =====
    'user.notFound': 'User not found',
    'user.minWithdraw': 'Minimum withdrawal amount is $100,000',
    'user.withdrawDataRequired': 'All bank account data is required',
    'user.notActiveWithdraw': 'Your account is not active for withdrawals',
    'user.exceedBalance': 'Withdrawal amount exceeds available balance',
    'user.withdrawSuccess': 'Withdrawal request submitted successfully. Please complete KYC verification via admin.',
    'user.withdrawNotifTitle': 'Withdrawal Request Received',
    'user.withdrawNotifMsg': (amount) => `Withdrawal request for $${Number(amount).toLocaleString('en-US')} is pending admin verification.`,
    'user.withdrawDesc': (bank) => `Withdrawal request to ${bank}`,
    'user.notifRead': 'Notification marked as read',
    'user.noDataChanged': 'No data to update',
    'user.profileUpdated': 'Profile updated successfully',
    'user.passwordRequired': 'Current and new password are required',
    'user.newPasswordMin': 'New password must be at least 6 characters',
    'user.oldPasswordWrong': 'Current password is incorrect',
    'user.passwordChanged': 'Password changed successfully',
    'user.fileNotFound': 'File not found',
    'user.docUploaded': 'Document uploaded successfully',

    // ===== Withdrawal Controller =====
    'withdraw.allFieldsRequired': 'All fields are required',
    'withdraw.invalidAmount': 'Withdrawal amount must be a positive number',
    'withdraw.minAmount': (amount) => `Minimum withdrawal amount is $${Number(amount).toLocaleString('en-US')}`,
    'withdraw.invalidAccount': 'Account number can only contain numbers',
    'withdraw.insufficientBalance': 'Insufficient balance for withdrawal',
    'withdraw.notFound': 'Withdrawal not found',
    'withdraw.invalidStatus': 'Invalid status',
    'withdraw.success': 'Withdrawal request submitted',
    'withdraw.statusUpdated': 'Withdrawal status updated',
    'withdraw.processed': 'Processing',
    'withdraw.processedMsg': (id) => `Withdrawal ${id} is being processed`,
    'withdraw.successMsg': (id) => `Withdrawal ${id} has been processed successfully`,
    'withdraw.rejected': 'Rejected',
    'withdraw.rejectedMsg': (id, note) => `Withdrawal ${id} has been rejected. ${note || ''}`,
    'withdraw.pending': 'Awaiting Verification',
    'withdraw.pendingMsg': (id) => `Withdrawal ${id} is awaiting verification`,
    'withdraw.notifTitle': 'Withdrawal Request Received',
    'withdraw.notifMsg': (id) => `Withdrawal ${id} is awaiting verification`,

    // ===== Admin Controller =====
    'admin.statusInvalid': 'Invalid status',
    'admin.noDataChanged': 'No data to update',
    'admin.userUpdated': 'User updated successfully',
    'admin.balanceNotifTitle': 'Balance Updated',
    'admin.balanceNotifMsg': (balance) => `Your balance has been updated by admin to $${Number(balance).toLocaleString('en-US')}`,
    'admin.userStatusNotifTitle': 'Account Status',
    'admin.userStatusNotifMsg': (label) => `Your account has been ${label} by admin.`,
    'admin.frozen': 'frozen',
    'admin.activated': 'activated',
    'admin.changed': 'updated',
    'admin.userStatusSuccess': (label) => `User successfully ${label}`,
    'admin.userDeleted': 'User deleted successfully',
    'admin.appNotFound': 'Application not found',
    'admin.appUpdated': 'Application updated successfully',
    'admin.appStatusSuccess': (status) => `Application status: ${status}`,
    'admin.approvedNotifTitle': 'Loan Approved',
    'admin.approvedNotifMsg': (id) => `Your loan application #${id} has been approved. Funds will be disbursed soon.`,
    'admin.rejectedNotifTitle': 'Loan Rejected',
    'admin.rejectedNotifMsg': (id, reason) => `Loan application #${id} has been rejected. Reason: ${reason}`,
    'admin.defaultRejectReason': 'Does not meet criteria',
    'admin.disbursedNotifTitle': 'Funds Disbursed',
    'admin.disbursedNotifMsg': (id, amount) => `Loan #${id} for $${Number(amount).toLocaleString('en-US')} has been disbursed to your balance.`,
    'admin.disbursementDesc': 'Loan disbursement',
    'admin.completedNotifTitle': 'Loan Paid Off',
    'admin.completedNotifMsg': (id) => `Loan #${id} has been paid off. Thank you.`,
    'admin.txNotFound': 'Transaction not found',
    'admin.txStatusSuccess': (status) => `Transaction status: ${status}`,
    'admin.txStatusNotifTitle': 'Transaction Status',
    'admin.txStatusNotifMsg': (id, type, status) => `Transaction #${id} (${type}) status: ${status}.`,
    'admin.settingsSaved': 'Settings saved successfully',
    'admin.telegramTestSuccess': 'Test telegram sent successfully',
    'admin.telegramTestFailed': 'Failed to send test telegram. Check bot configuration.',

    // ===== Validation =====
    'val.nameRequired': 'Full name is required',
    'val.nameMin': 'Full name must be at least 3 characters',
    'val.emailInvalid': 'Invalid email',
    'val.phoneInvalid': 'Invalid phone number',
    'val.passwordWeak': 'Password must be at least 6 characters, containing letters & numbers',
    'val.passwordMatch': 'Password confirmation does not match',
    'val.identifierRequired': 'Email/Phone number is required',
    'val.passwordRequired': 'Password is required',
    'val.amountRange': 'Loan amount must be RM500 - RM300,000',
    'val.tenorRange': 'Tenor must be 6 - 60 months',
    'val.purposeRequired': 'Loan purpose is required',
    'val.adminCodeRequired': 'Admin code is required',
    'val.adminCodeInvalid': 'Invalid admin code format',
    'val.csCodeInvalid': 'Invalid CS code format',

    // ===== Admin Code =====
    'admin.noAdminCode': 'You are not registered with an admin code. Please contact admin to get a registration code.',
    'admin.codeNotFound': 'Admin code not found',

    // ===== Error Handler =====
    'error.notFound': 'Endpoint not found',
    'error.fileSize': 'Maximum file size is 5MB',
    'error.fileImage': 'Only image files (JPG/PNG) are allowed',
    'error.server': 'An error occurred on the server',
    'error.tooManyRequests': 'Too many requests. Please try again later.',
    'error.invalidJson': 'Invalid JSON format',

    // ===== Health =====
    'health.running': 'SMART FUND API is running',

    // ===== Telegram =====
    'telegram.newLoanTitle': 'NEW LOAN APPLICATION',
    'telegram.borrowerData': 'Borrower Data',
    'telegram.name': 'Name',
    'telegram.phone': 'Phone',
    'telegram.email': 'Email',
    'telegram.adminData': 'Admin Data',
    'telegram.adminCode': 'Admin Code',
    'telegram.adminName': 'Admin Name',
    'telegram.loanDetail': 'Loan Details',
    'telegram.amount': 'Amount',
    'telegram.tenor': 'Tenor',
    'telegram.month': 'months',
    'telegram.purpose': 'Purpose',
    'telegram.calculation': 'Calculation',
    'telegram.monthly': 'Installment/Month',
    'telegram.totalInterest': 'Total Interest',
    'telegram.totalPayment': 'Total Payment',
    'telegram.time': 'Time',
    'telegram.verifyPrompt': 'Please verify and process this application through the admin dashboard.',
    'telegram.viewDashboard': '📊 View Admin Dashboard',
    'telegram.chatUser': '💬 Chat User',
    'telegram.welcomeChat': (name) => `Hello ${name}, thank you for applying for a loan at SMART FUND. How can we help?`,
    'telegram.testMessage': '✅ <b>SMART FUND Test Notification</b>\n\nTelegram notification is working properly.',
    'telegram.newWithdrawalTitle': 'NEW WITHDRAWAL',

    // ===== CS Code =====
    'cs.title': 'CS Code',
    'cs.myCode': 'Your CS Code',
    'cs.placeholder': 'Enter CS code',
    'cs.copySuccess': 'CS code copied successfully',
    'cs.noCsCode': 'You do not have a CS code',
    'telegram.csData': 'CS Data',
    'telegram.csCode': 'CS Code',
    'telegram.csName': 'CS Name',

    // ===== Admin CS =====
    'admin.csManagement': 'Manage CS Codes',
    'admin.csList': 'CS Code List',
    'admin.csCode': 'CS Code',
    'admin.csName': 'CS Name',
    'admin.csStatus': 'CS Status',
    'admin.csCreate': 'Create CS Code',
    'admin.csCreated': 'CS code created successfully',
    'admin.csUpdated': 'CS code updated successfully',
    'admin.csDeleted': 'CS code deleted successfully',
    'admin.csNotFound': 'CS code not found',
    'admin.csActive': 'Active',
    'admin.csInactive': 'Inactive',
    'admin.superAdminOnly': 'Only Super Admin can do this',

    // ===== Status Labels =====
    'status.pending': 'Pending',
    'status.approved': 'Approved',
    'status.disbursed': 'Disbursed',
    'status.rejected': 'Rejected',
    'status.completed': 'Paid Off',
    'status.active': 'Active',
    'status.frozen': 'Frozen',
  },
};

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Detect language from request
 * Priority: query param > header > default
 */
function detectLang(req) {
  // 1. Check query parameter (?lang=en)
  if (req && req.query && req.query.lang && MESSAGES[req.query.lang]) {
    return req.query.lang;
  }

  // 2. Check Accept-Language header
  if (req && req.headers && req.headers['accept-language']) {
    const headerLang = req.headers['accept-language'].toLowerCase();
    // Parse "en-US,en;q=0.9,id;q=0.8" format
    const primary = headerLang.split(',')[0].split('-')[0].split(';')[0].trim();
    if (MESSAGES[primary]) return primary;
  }

  // 3. Check custom X-Lang header (sent by frontend)
  if (req && req.headers && req.headers['x-lang'] && MESSAGES[req.headers['x-lang']]) {
    return req.headers['x-lang'];
  }

   // 4. Default to Bahasa Malaysia
   return 'ms';
}

/**
 * Translate a message key
 * @param {string} lang - Language code (id, ms, en)
 * @param {string} key - Message key
 * @param  {...any} args - Arguments for message functions
 * @returns {string} Translated message
 */
function t(lang, key, ...args) {
  const messages = MESSAGES[lang] || MESSAGES.ms;
  const msg = messages[key] || MESSAGES.ms[key] || key;
  if (typeof msg === 'function') return msg(...args);
  return msg;
}

/**
 * Get locale configuration for a language
 */
function getLocaleConfig(lang) {
  return LOCALE_CONFIG[lang] || LOCALE_CONFIG.ms;
}

/**
 * Format currency for a language (NO conversion)
 * The same numeric value is formatted per locale
 */
function formatCurrency(lang, amount) {
  const config = getLocaleConfig(lang);
  const num = Number(amount || 0);
  const formatted = num.toLocaleString(config.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${config.symbol}${formatted}`;
}

/**
 * Format number for a language
 */
function formatNumber(lang, num) {
  const config = getLocaleConfig(lang);
  return Number(num || 0).toLocaleString(config.locale);
}

/**
 * Format date for a language
 */
function formatDate(lang, dateStr) {
  if (!dateStr) return '-';
  const config = getLocaleConfig(lang);
  const d = new Date(dateStr);
  return d.toLocaleDateString(config.locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format date and time for a language
 */
function formatDateTime(lang, dateStr) {
  if (!dateStr) return '-';
  const config = getLocaleConfig(lang);
  const d = new Date(dateStr);
  return d.toLocaleString(config.locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status label for a language
 */
function statusLabel(lang, status) {
  return t(lang, `status.${status}`) || status;
}

module.exports = {
  LOCALE_CONFIG,
  MESSAGES,
  detectLang,
  t,
  getLocaleConfig,
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  statusLabel,
};
