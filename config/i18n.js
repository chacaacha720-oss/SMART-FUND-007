/**
 * SMART FUND - Backend Internationalization (i18n)
 * Supports: Indonesia (id), Malaysia (ms), English (en)
 *
 * Each language has its own:
 * - Locale code (id-ID, ms-MY, en-US)
 * - Currency code (IDR, MYR, USD)
 * - Currency symbol (Rp, RM, $)
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
  id: {
    locale: 'id-ID',
    currency: 'IDR',
    symbol: 'Rp',
    label: 'Bahasa Indonesia',
  },
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
  id: {
    // ===== AUTH =====
    'auth.tokenNotFound': 'Token tidak ditemukan. Silakan login.',
    'auth.notUser': 'Akses ditolak. Bukan akun user.',
    'auth.userNotFound': 'User tidak ditemukan.',
    'auth.accountFrozen': 'Akun Anda dibekukan. Hubungi admin.',
    'auth.tokenInvalid': 'Token tidak valid atau kadaluarsa.',
    'auth.adminTokenNotFound': 'Token admin tidak ditemukan.',
    'auth.notAdmin': 'Akses ditolak. Bukan admin.',
    'auth.adminNotFound': 'Admin tidak ditemukan.',
    'auth.adminInactive': 'Akun admin nonaktif.',
    'auth.adminTokenInvalid': 'Token admin tidak valid atau kadaluarsa.',

    // ===== Auth Controller =====
    'auth.emailExists': 'Email sudah terdaftar',
    'auth.registerSuccess': 'Registrasi berhasil. Anda otomatis login.',
    'auth.welcomeNotif': 'Selamat Datang di SMART FUND!',
    'auth.welcomeMsg': (name) => `Halo ${name}, akun Anda berhasil dibuat. Nikmati berbagai kemudahan pinjaman online bersama kami.`,
    'auth.loginSuccess': 'Login berhasil',
    'auth.loginFailed': 'Email/Nomor HP atau password salah',
    'auth.accountFrozenLogin': 'Akun Anda dibekukan. Hubungi admin.',
    'auth.identifierRequired': 'Email atau nomor HP wajib diisi',
    'auth.accountNotFound': 'Akun tidak ditemukan',
    'auth.otpSent': 'OTP telah dikirim ke email & SMS Anda',
    'auth.emailOtpRequired': 'Email dan OTP wajib diisi',
    'auth.otpInvalid': 'OTP tidak valid atau kadaluarsa',
    'auth.otpValid': 'OTP valid',
    'auth.tokenPasswordRequired': 'Token dan password baru wajib diisi',
    'auth.passwordMin': 'Password minimal 6 karakter',
    'auth.resetTokenInvalid': 'Token tidak valid atau kadaluarsa',
    'auth.passwordChanged': 'Password berhasil diubah. Silakan login.',
    'auth.userNotFound404': 'User tidak ditemukan',
    'auth.adminCodeInvalid': 'Kode admin tidak valid',
    'auth.adminCodeNotFound': 'Kode admin tidak ditemukan',
    'auth.adminInactive': 'Akun admin nonaktif.',

    // ===== Admin Auth =====
    'admin.userPassRequired': 'Username dan password wajib diisi',
    'admin.loginFailed': 'Username atau password salah',
    'admin.inactive': 'Akun admin nonaktif',
    'admin.loginSuccess': 'Login admin berhasil',

    // ===== Loan Controller =====
    'loan.amountRange': 'Jumlah pinjaman harus Rp1.000.000 - Rp500.000.000',
    'loan.tenorRange': 'Tenor harus 6 - 60 bulan',
    'loan.purposeRequired': 'Tujuan pinjaman wajib diisi',
    'loan.userNotFound': 'User tidak ditemukan',
    'loan.accountFrozen': 'Akun dibekukan. Tidak dapat mengajukan pinjaman.',
    'loan.exceedLimit': (limit) => `Jumlah melebihi limit pinjaman Anda (Rp${Number(limit).toLocaleString('id-ID')})`,
    'loan.hasActiveLoan': 'Anda masih memiliki pinjaman aktif. Selesaikan terlebih dahulu.',
    'loan.applySuccess': 'Pengajuan berhasil dikirim. Status: Menunggu Persetujuan.',
    'loan.notFound': 'Pinjaman tidak ditemukan',
    'loan.notifTitle': 'Pengajuan Pinjaman Diterima',
    'loan.notifMsg': (id, amount) => `Pengajuan pinjaman #${id} sebesar Rp${Number(amount).toLocaleString('id-ID')} telah diterima dan sedang menunggu persetujuan admin.`,

    // ===== User Controller =====
    'user.notFound': 'User tidak ditemukan',
    'user.minWithdraw': 'Nominal penarikan minimal Rp 100.000',
    'user.withdrawDataRequired': 'Semua data rekening tujuan wajib diisi',
    'user.notActiveWithdraw': 'Akun Anda belum aktif untuk melakukan penarikan',
    'user.exceedBalance': 'Nominal penarikan melebihi saldo yang tersedia',
    'user.withdrawSuccess': 'Permintaan penarikan berhasil dikirim. Silakan lakukan verifikasi KYC melalui admin.',
    'user.withdrawNotifTitle': 'Permintaan Penarikan Diterima',
    'user.withdrawNotifMsg': (amount) => `Permintaan penarikan sebesar Rp${Number(amount).toLocaleString('id-ID')} sedang menunggu verifikasi admin.`,
    'user.withdrawDesc': (bank) => `Permintaan penarikan ke ${bank}`,
    'user.notifRead': 'Notifikasi dibaca',
    'user.noDataChanged': 'Tidak ada data yang diubah',
    'user.profileUpdated': 'Profil berhasil diperbarui',
    'user.passwordRequired': 'Password lama dan baru wajib diisi',
    'user.newPasswordMin': 'Password baru minimal 6 karakter',
    'user.oldPasswordWrong': 'Password lama salah',
    'user.passwordChanged': 'Password berhasil diubah',
    'user.fileNotFound': 'File tidak ditemukan',
    'user.docUploaded': 'Dokumen berhasil diupload',

    // ===== Admin Controller =====
    'admin.statusInvalid': 'Status tidak valid',
    'admin.noDataChanged': 'Tidak ada data diubah',
    'admin.userUpdated': 'User berhasil diperbarui',
    'admin.balanceNotifTitle': 'Saldo Diperbarui',
    'admin.balanceNotifMsg': (balance) => `Saldo Anda telah diperbarui oleh admin menjadi Rp${Number(balance).toLocaleString('id-ID')}`,
    'admin.userStatusNotifTitle': 'Status Akun',
    'admin.userStatusNotifMsg': (label) => `Akun Anda telah ${label} oleh admin.`,
    'admin.frozen': 'dibekukan',
    'admin.activated': 'diaktifkan',
    'admin.changed': 'diubah',
    'admin.userStatusSuccess': (label) => `User berhasil ${label}`,
    'admin.userDeleted': 'User berhasil dihapus',
    'admin.appNotFound': 'Pengajuan tidak ditemukan',
    'admin.appUpdated': 'Pengajuan berhasil diperbarui',
    'admin.appStatusSuccess': (status) => `Status pengajuan: ${status}`,
    'admin.approvedNotifTitle': 'Pinjaman Disetujui',
    'admin.approvedNotifMsg': (id) => `Pengajuan pinjaman #${id} Anda telah disetujui. Dana akan segera dicairkan.`,
    'admin.rejectedNotifTitle': 'Pinjaman Ditolak',
    'admin.rejectedNotifMsg': (id, reason) => `Pengajuan pinjaman #${id} ditolak. Alasan: ${reason}`,
    'admin.defaultRejectReason': 'Tidak memenuhi kriteria',
    'admin.disbursedNotifTitle': 'Dana Cair',
    'admin.disbursedNotifMsg': (id, amount) => `Pinjaman #${id} sebesar Rp${Number(amount).toLocaleString('id-ID')} telah dicairkan ke saldo Anda.`,
    'admin.disbursementDesc': 'Pencairan pinjaman',
    'admin.completedNotifTitle': 'Pinjaman Lunas',
    'admin.completedNotifMsg': (id) => `Pinjaman #${id} telah lunas. Terima kasih.`,
    'admin.txNotFound': 'Transaksi tidak ditemukan',
    'admin.txStatusSuccess': (status) => `Status transaksi: ${status}`,
    'admin.txStatusNotifTitle': 'Status Transaksi',
    'admin.txStatusNotifMsg': (id, type, status) => `Transaksi #${id} (${type}) status: ${status}.`,
    'admin.settingsSaved': 'Pengaturan berhasil disimpan',
    'admin.telegramTestSuccess': 'Test telegram berhasil dikirim',
    'admin.telegramTestFailed': 'Gagal mengirim test telegram. Periksa konfigurasi bot.',

    // ===== Validation =====
    'val.nameRequired': 'Nama lengkap wajib diisi',
    'val.nameMin': 'Nama lengkap minimal 3 karakter',
    'val.emailInvalid': 'Email tidak valid',
    'val.phoneInvalid': 'Nomor HP tidak valid',
    'val.passwordWeak': 'Password minimal 6 karakter, mengandung huruf & angka',
    'val.passwordMatch': 'Konfirmasi password tidak cocok',
    'val.identifierRequired': 'Email/Nomor HP wajib diisi',
    'val.passwordRequired': 'Password wajib diisi',
    'val.amountRange': 'Jumlah pinjaman harus Rp1.000.000 - Rp500.000.000',
    'val.tenorRange': 'Tenor harus 6 - 60 bulan',
    'val.purposeRequired': 'Tujuan pinjaman wajib diisi',
    'val.adminCodeRequired': 'Kode admin wajib diisi',
    'val.adminCodeInvalid': 'Format kode admin tidak valid',

    // ===== Admin Code =====
    'admin.noAdminCode': 'Anda belum terdaftar dengan kode admin. Hubungi admin untuk mendapatkan kode pendaftaran.',
    'admin.codeNotFound': 'Kode admin tidak ditemukan',

    // ===== Error Handler =====
    'error.notFound': 'Endpoint tidak ditemukan',
    'error.fileSize': 'Ukuran file maksimal 5MB',
    'error.fileImage': 'Hanya file gambar (JPG/PNG) yang diperbolehkan',
    'error.server': 'Terjadi kesalahan server',
    'error.tooManyRequests': 'Terlalu banyak request. Coba lagi nanti.',
    'error.invalidJson': 'Format JSON tidak valid',

    // ===== Health =====
    'health.running': 'SMART FUND API berjalan',

    // ===== Telegram =====
    'telegram.newLoanTitle': 'PENGAJUAN PINJAMAN BARU',
    'telegram.borrowerData': 'Data Peminjam',
    'telegram.name': 'Nama',
    'telegram.phone': 'No. HP',
    'telegram.email': 'Email',
    'telegram.adminData': 'Data Admin',
    'telegram.adminCode': 'Kode Admin',
    'telegram.adminName': 'Nama Admin',
    'telegram.loanDetail': 'Detail Pinjaman',
    'telegram.amount': 'Jumlah',
    'telegram.tenor': 'Tenor',
    'telegram.month': 'bulan',
    'telegram.purpose': 'Tujuan',
    'telegram.calculation': 'Perhitungan',
    'telegram.monthly': 'Cicilan/Bulan',
    'telegram.totalInterest': 'Total Bunga',
    'telegram.totalPayment': 'Total Bayar',
    'telegram.time': 'Waktu',
    'telegram.verifyPrompt': 'Segera verifikasi dan proses pengajuan ini melalui dashboard admin.',
    'telegram.viewDashboard': '📊 Lihat Dashboard Admin',
    'telegram.chatUser': '💬 Chat User',
    'telegram.welcomeChat': (name) => `Halo ${name}, terima kasih telah mengajukan pinjaman di SMART FUND. Ada yang bisa kami bantu?`,
    'telegram.testMessage': '✅ <b>Test Notifikasi SMART FUND</b>\n\nNotifikasi Telegram berfungsi dengan baik.',

    // ===== Status Labels =====
    'status.pending': 'Menunggu',
    'status.approved': 'Disetujui',
    'status.disbursed': 'Dana Cair',
    'status.rejected': 'Ditolak',
    'status.completed': 'Lunas',
    'status.active': 'Aktif',
    'status.frozen': 'Dibekukan',
  },

  ms: {
    // ===== Auth =====
    'auth.tokenNotFound': 'Token tidak dijumpai. Sila log masuk.',
    'auth.notUser': 'Akses dinafikan. Bukan akaun pengguna.',
    'auth.userNotFound': 'Pengguna tidak dijumpai.',
    'auth.accountFrozen': 'Akaun anda dibekukan. Hubungi admin.',
    'auth.tokenInvalid': 'Token tidak sah atau tamat tempoh.',
    'auth.adminTokenNotFound': 'Token admin tidak dijumpai.',
    'auth.notAdmin': 'Akses dinafikan. Bukan admin.',
    'auth.adminNotFound': 'Admin tidak dijumpai.',
    'auth.adminInactive': 'Akaun admin tidak aktif.',
    'auth.adminTokenInvalid': 'Token admin tidak sah atau tamat tempoh.',

    // ===== Auth Controller =====
    'auth.emailExists': 'Emel sudah berdaftar',
    'auth.registerSuccess': 'Pendaftaran berjaya. Anda auto log masuk.',
    'auth.welcomeNotif': 'Selamat Datang ke SMART FUND!',
    'auth.welcomeMsg': (name) => `Halo ${name}, akaun anda berjaya dibuat. Nikmati pelbagai kemudahan pinjaman dalam talian bersama kami.`,
    'auth.loginSuccess': 'Log masuk berjaya',
    'auth.loginFailed': 'Emel/Nombor HP atau kata laluan salah',
    'auth.accountFrozenLogin': 'Akaun anda dibekukan. Hubungi admin.',
    'auth.identifierRequired': 'Emel atau nombor HP diperlukan',
    'auth.accountNotFound': 'Akaun tidak dijumpai',
    'auth.otpSent': 'OTP telah dihantar ke emel & SMS anda',
    'auth.emailOtpRequired': 'Emel dan OTP diperlukan',
    'auth.otpInvalid': 'OTP tidak sah atau tamat tempoh',
    'auth.otpValid': 'OTP sah',
    'auth.tokenPasswordRequired': 'Token dan kata laluan baru diperlukan',
    'auth.passwordMin': 'Kata laluan minimum 6 aksara',
    'auth.resetTokenInvalid': 'Token tidak sah atau tamat tempoh',
    'auth.passwordChanged': 'Kata laluan berjaya diubah. Sila log masuk.',
    'auth.userNotFound404': 'Pengguna tidak dijumpai',
    'auth.adminCodeInvalid': 'Kod admin tidak sah',
    'auth.adminCodeNotFound': 'Kod admin tidak dijumpai',
    'auth.adminInactive': 'Akaun admin tidak aktif.',

    // ===== Admin Auth =====
    'admin.userPassRequired': 'Nama pengguna dan kata laluan diperlukan',
    'admin.loginFailed': 'Nama pengguna atau kata laluan salah',
    'admin.inactive': 'Akaun admin tidak aktif',
    'admin.loginSuccess': 'Log masuk admin berjaya',

    // ===== Loan Controller =====
    'loan.amountRange': 'Jumlah pinjaman mesti RM1,000 - RM500,000',
    'loan.tenorRange': 'Tempoh mesti 6 - 60 bulan',
    'loan.purposeRequired': 'Tujuan pinjaman diperlukan',
    'loan.userNotFound': 'Pengguna tidak dijumpai',
    'loan.accountFrozen': 'Akaun dibekukan. Tidak boleh memohon pinjaman.',
    'loan.exceedLimit': (limit) => `Jumlah melebihi had pinjaman anda (RM${Number(limit).toLocaleString('ms-MY')})`,
    'loan.hasActiveLoan': 'Anda masih mempunyai pinjaman aktif. Selesaikan dahulu.',
    'loan.applySuccess': 'Permohonan berjaya dihantar. Status: Menunggu Kelulusan.',
    'loan.notFound': 'Pinjaman tidak dijumpai',
    'loan.notifTitle': 'Permohonan Pinjaman Diterima',
    'loan.notifMsg': (id, amount) => `Permohonan pinjaman #${id} sebanyak RM${Number(amount).toLocaleString('ms-MY')} telah diterima dan sedang menunggu kelulusan admin.`,

    // ===== User Controller =====
    'user.notFound': 'Pengguna tidak dijumpai',
    'user.minWithdraw': 'Jumlah pengeluaran minimum RM 100',
    'user.withdrawDataRequired': 'Semua data akaun bank diperlukan',
    'user.notActiveWithdraw': 'Akaun anda belum aktif untuk membuat pengeluaran',
    'user.exceedBalance': 'Jumlah pengeluaran melebihi baki tersedia',
    'user.withdrawSuccess': 'Permintaan pengeluaran berjaya dihantar. Sila buat pengesahan KYC melalui admin.',
    'user.withdrawNotifTitle': 'Permintaan Pengeluaran Diterima',
    'user.withdrawNotifMsg': (amount) => `Permintaan pengeluaran sebanyak RM${Number(amount).toLocaleString('ms-MY')} sedang menunggu pengesahan admin.`,
    'user.withdrawDesc': (bank) => `Permintaan pengeluaran ke ${bank}`,
    'user.notifRead': 'Notifikasi dibaca',
    'user.noDataChanged': 'Tiada data diubah',
    'user.profileUpdated': 'Profil berjaya dikemas kini',
    'user.passwordRequired': 'Kata laluan lama dan baru diperlukan',
    'user.newPasswordMin': 'Kata laluan baharu minimum 6 aksara',
    'user.oldPasswordWrong': 'Kata laluan lama salah',
    'user.passwordChanged': 'Kata laluan berjaya diubah',
    'user.fileNotFound': 'Fail tidak dijumpai',
    'user.docUploaded': 'Dokumen berjaya dimuat naik',

    // ===== Admin Controller =====
    'admin.statusInvalid': 'Status tidak sah',
    'admin.noDataChanged': 'Tiada data diubah',
    'admin.userUpdated': 'Pengguna berjaya dikemas kini',
    'admin.balanceNotifTitle': 'Baki Dikemas Kini',
    'admin.balanceNotifMsg': (balance) => `Baki anda telah dikemas kini oleh admin kepada RM${Number(balance).toLocaleString('ms-MY')}`,
    'admin.userStatusNotifTitle': 'Status Akaun',
    'admin.userStatusNotifMsg': (label) => `Akaun anda telah ${label} oleh admin.`,
    'admin.frozen': 'dibekukan',
    'admin.activated': 'diaktifkan',
    'admin.changed': 'diubah',
    'admin.userStatusSuccess': (label) => `Pengguna berjaya ${label}`,
    'admin.userDeleted': 'Pengguna berjaya dipadam',
    'admin.appNotFound': 'Permohonan tidak dijumpai',
    'admin.appUpdated': 'Permohonan berjaya dikemas kini',
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
    'admin.telegramTestSuccess': 'Test telegram berjaya dihantar',
    'admin.telegramTestFailed': 'Gagal menghantar test telegram. Semak konfigurasi bot.',

    // ===== Validation =====
    'val.nameRequired': 'Nama penuh diperlukan',
    'val.nameMin': 'Nama penuh minimum 3 aksara',
    'val.emailInvalid': 'Emel tidak sah',
    'val.phoneInvalid': 'Nombor HP tidak sah',
    'val.passwordWeak': 'Kata laluan minimum 6 aksara, mengandungi huruf & nombor',
    'val.passwordMatch': 'Sahkan kata laluan tidak sepadan',
    'val.identifierRequired': 'Emel/Nombor HP diperlukan',
    'val.passwordRequired': 'Kata laluan diperlukan',
    'val.amountRange': 'Jumlah pinjaman mesti RM1,000 - RM500,000',
    'val.tenorRange': 'Tempoh mesti 6 - 60 bulan',
    'val.purposeRequired': 'Tujuan pinjaman diperlukan',
    'val.adminCodeRequired': 'Kod admin diperlukan',
    'val.adminCodeInvalid': 'Format kod admin tidak sah',

    // ===== Admin Code =====
    'admin.noAdminCode': 'Anda belum berdaftar dengan kod admin. Hubungi admin untuk mendapatkan kod pendaftaran.',
    'admin.codeNotFound': 'Kod admin tidak dijumpai',

    // ===== Error Handler =====
    'error.notFound': 'Endpoint tidak dijumpai',
    'error.fileSize': 'Saiz fail maksimum 5MB',
    'error.fileImage': 'Hanya fail imej (JPG/PNG) yang dibenarkan',
    'error.server': 'Berlaku ralat pelayan',
    'error.tooManyRequests': 'Terlalu banyak permintaan. Cuba lagi nanti.',

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
    'telegram.totalInterest': 'Jumlah Faedah',
    'telegram.totalPayment': 'Jumlah Bayar',
    'telegram.time': 'Waktu',
    'telegram.verifyPrompt': 'Segera sahkan dan proses permohonan ini melalui dashboard admin.',
    'telegram.viewDashboard': '📊 Lihat Dashboard Admin',
    'telegram.chatUser': '💬 Chat Pengguna',
    'telegram.welcomeChat': (name) => `Halo ${name}, terima kasih telah memohon pinjaman di SMART FUND. Ada yang boleh kami bantu?`,
    'telegram.testMessage': '✅ <b>Test Notifikasi SMART FUND</b>\n\nNotifikasi Telegram berfungsi dengan baik.',

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

    // ===== Admin Auth =====
    'admin.userPassRequired': 'Username and password are required',
    'admin.loginFailed': 'Username or password is incorrect',
    'admin.inactive': 'Admin account is inactive',
    'admin.loginSuccess': 'Admin login successful',

    // ===== Loan Controller =====
    'loan.amountRange': 'Loan amount must be $1,000 - $500,000',
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
    'user.minWithdraw': 'Minimum withdrawal amount is $100',
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
    'val.amountRange': 'Loan amount must be $1,000 - $500,000',
    'val.tenorRange': 'Tenor must be 6 - 60 months',
    'val.purposeRequired': 'Loan purpose is required',
    'val.adminCodeRequired': 'Admin code is required',
    'val.adminCodeInvalid': 'Invalid admin code format',

    // ===== Admin Code =====
    'admin.noAdminCode': 'You are not registered with an admin code. Please contact admin to get a registration code.',
    'admin.codeNotFound': 'Admin code not found',

    // ===== Error Handler =====
    'error.notFound': 'Endpoint not found',
    'error.fileSize': 'Maximum file size is 5MB',
    'error.fileImage': 'Only image files (JPG/PNG) are allowed',
    'error.server': 'An error occurred on the server',
    'error.tooManyRequests': 'Too many requests. Please try again later.',

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

  // 4. Default to Indonesian
  return 'id';
}

/**
 * Translate a message key
 * @param {string} lang - Language code (id, ms, en)
 * @param {string} key - Message key
 * @param  {...any} args - Arguments for message functions
 * @returns {string} Translated message
 */
function t(lang, key, ...args) {
  const messages = MESSAGES[lang] || MESSAGES.id;
  const msg = messages[key] || MESSAGES.id[key] || key;
  if (typeof msg === 'function') return msg(...args);
  return msg;
}

/**
 * Get locale configuration for a language
 */
function getLocaleConfig(lang) {
  return LOCALE_CONFIG[lang] || LOCALE_CONFIG.id;
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