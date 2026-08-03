# 🏦 SMART FUND - Platform Pinjaman Online Terpercaya

Website pinjaman online profesional dengan tampilan modern seperti aplikasi fintech Indonesia (Kredivo, Akulaku, JULO). Dilengkapi sistem lengkap mulai dari landing page, autentikasi, dashboard user, dashboard admin, database MySQL, dan integrasi Telegram Bot untuk notifikasi real-time.

## ✨ Fitur Utama

### 🌐 Landing Page
- Hero Section dengan animasi
- Keunggulan produk (Bunga 5%, Proses Cepat, Persyaratan Mudah, Berizin OJK)
- Loan Calculator dengan slider real-time (Rp1jt - Rp500jt, 6-60 bulan)
- Multi Step Form pengajuan
- Testimoni nasabah
- FAQ interaktif
- Footer lengkap

### 🔐 Autentikasi
- **Login** dengan Email/Nomor HP + Password, Remember Me, Lupa Password
- **Registrasi** multi-step: Data Pribadi → Verifikasi OTP (dummy) → Syarat & Ketentuan
- Auto login setelah registrasi
- **Forgot Password**: Email/HP → OTP → Password Baru
- Password hide/show, loading button, error notification, validasi form

### 👤 Dashboard User
- Sidebar: Dashboard, Ajukan Pinjaman, Riwayat, Saldo, Limit, Profil, Upload Dokumen, Pengaturan, Logout
- Ringkasan: Selamat Datang, Status Akun, Saldo, Limit, Total Tagihan, Riwayat Transaksi, Status Pengajuan
- Form pengajuan pinjaman 2-step (Data Diri → Data Pinjaman)
- Notifikasi in-app
- Upload dokumen KTP
- Ganti password

### 🛡️ Dashboard Admin
- **Login Admin** terpisah
- Sidebar: Dashboard, Data User, Pengajuan, Transaksi, Telegram, Setting Website, Logout
- Statistik: Total User, Total Pengajuan, Pinjaman Aktif, Dana Cair, Pinjaman Lunas, Grafik (Chart.js)
- **Manajemen User**: lihat, edit (saldo, limit, status), hapus, bekukan/aktifkan akun
- **Manajemen Pinjaman**: approve, reject, disburse (cairkan dana → saldo user bertambah otomatis), edit nominal/tenor, tambah catatan
- **Manajemen Transaksi/Withdraw**: approve/reject
- **Pengaturan Telegram**: test notifikasi, lihat log
- **Setting Website**: ubah nama, bunga, limit, tenor, kontak

### 🤖 Telegram Bot Notification
Saat user submit pengajuan pinjaman, bot otomatis mengirim pesan ke admin Telegram berisi:
- Nama, Nomor HP, Email, ID User
- Jumlah Pinjaman, Tenor, Tujuan
- Cicilan, Total Bunga, Total Pembayaran
- Tanggal & Application ID
- Tombol inline: **Lihat Dashboard** & **Chat User**

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MySQL** (mysql2/promise)
- **JWT** Authentication
- **bcrypt** Password Hashing
- **Express Session**
- **Multer** File Upload
- **Helmet** (security headers)
- **express-rate-limit** (rate limiting)
- **validator** (server-side validation)
- **Axios** (Telegram Bot API)

### Frontend
- **HTML5**
- **TailwindCSS** (CDN)
- **JavaScript** (Vanilla)
- **Chart.js** (grafik statistik)
- **SweetAlert2** (alert & confirm)
- **AOS** (scroll animation)
- **Font Awesome** (icons)
- **Google Fonts** (Plus Jakarta Sans)
- **Dark Mode** support
- **Responsive 100%** (mobile-first)

### Database (MySQL)
Tabel: `users`, `loan_applications`, `transactions`, `notifications`, `admins`, `settings`, `telegram_logs`, `password_resets`

### Keamanan
- ✅ Helmet (HTTP headers)
- ✅ JWT Authentication
- ✅ bcrypt Password Hashing
- ✅ SQL Injection Protection (parameterized queries)
- ✅ XSS Protection (validator escape)
- ✅ Rate Limiting
- ✅ Server-side Validation
- ✅ Secure Session
- ✅ CORS Configuration

## 📁 Struktur Folder

```
SMART-FUND/
├── server.js                 # Main server entry point
├── package.json              # Dependencies & scripts
├── .env                      # Environment config (jangan commit!)
├── .env.example              # Template environment
├── .gitignore
├── README.md
│
├── config/
│   ├── db.js                 # MySQL connection pool
│   └── telegram.js           # Telegram Bot notification service
│
├── controllers/
│   ├── authController.js     # Register, Login, Forgot Password, OTP
│   ├── loanController.js     # Simulasi, Pengajuan, Riwayat pinjaman
│   ├── userController.js     # Dashboard, profil, transaksi, notifikasi
│   └── adminController.js    # Admin dashboard, manajemen user/pinjaman
│
├── routes/
│   ├── index.js              # Route aggregator
│   ├── authRoutes.js         # /api/auth/*
│   ├── loanRoutes.js         # /api/loans/*
│   ├── userRoutes.js         # /api/user/*
│   └── adminRoutes.js        # /api/admin/*
│
├── middleware/
│   ├── auth.js               # JWT verification (user & admin)
│   ├── validate.js           # Input validation & sanitization
│   └── errorHandler.js       # Error & 404 handlers
│
├── database/
│   ├── schema.sql            # MySQL schema (CREATE TABLE)
│   └── init.js               # Database initialization script
│
├── uploads/                  # File upload directory (KTP, dokumen)
│   └── .gitkeep
│
└── public/                   # Frontend static files
    ├── index.html            # Landing page
    ├── login.html            # Login user
    ├── register.html         # Registrasi user
    ├── forgot-password.html  # Lupa password
    ├── dashboard.html        # Dashboard user
    ├── admin.html            # Dashboard admin
    └── assets/
        ├── css/
        │   └── style.css     # Custom styles
        └── js/
            ├── api.js        # API helper, token, utils
            ├── main.js       # Landing page logic
            ├── dashboard.js  # User dashboard logic
            └── admin.js      # Admin dashboard logic
```

## 🚀 Deploy ke Railway

Project ini sudah siap untuk di-deploy di Railway dengan konfigurasi standar Node.js.

1. Push project ke GitHub.
2. Buat project baru di Railway dan pilih repository ini.
3. Tambahkan variabel environment berikut:
   - `PORT` (Railway akan mengisi otomatis)
   - `NODE_ENV=production`
   - `DB_HOST` (atau `MYSQLHOST` / `MYSQL_HOST`)
   - `DB_PORT` (atau `MYSQLPORT` / `MYSQL_PORT`)
   - `DB_USER` (atau `MYSQLUSER` / `MYSQL_USER`)
   - `DB_PASSWORD` (atau `MYSQLPASSWORD` / `MYSQL_PASSWORD`)
   - `DB_NAME` (atau `MYSQLDATABASE` / `MYSQL_DB`)
   - `JWT_SECRET`
   - `SESSION_SECRET`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_ADMIN_CHAT_ID`
   - `CORS_ORIGIN=https://your-frontend-domain.com` atau `*` untuk testing
4. Jalankan `npm run db:init` pada satu-time command atau melalui Railway service command setelah database tersedia.
5. Railway akan otomatis menjalankan `npm start`.

## 🚀 Cara Install & Menjalankan

### Prasyarat
- **Node.js** v14+ 
- **MySQL** v5.7+ atau v8+
- **Telegram Bot Token** (opsional, untuk notifikasi)

### Langkah Installasi

1. **Clone / Download project**
   ```bash
   cd SMART-FUND
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Konfigurasi environment**
   ```bash
   # Edit file .env dengan kredensial Anda
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=password_anda
   DB_NAME=smart_fund
   
   # Telegram Bot (opsional)
   TELEGRAM_BOT_TOKEN=bot_token_anda
   TELEGRAM_ADMIN_CHAT_ID=chat_id_admin
   ```

4. **Inisialisasi database**
   ```bash
   npm run db:init
   ```
   Script ini akan:
   - Membuat database `smart_fund` dan semua tabel
   - Membuat admin default: `admin` / `Admin@12345`

5. **Jalankan server**
   ```bash
   npm start
   # atau untuk development:
   npm run dev
   ```

6. **Akses website**
   - Landing Page: `http://localhost:3000`
   - Login User: `http://localhost:3000/login.html`
   - Dashboard User: `http://localhost:3000/dashboard.html`
   - Admin: `http://localhost:3000/admin.html`

## 🔑 Default Credentials

| Role  | Username/Email | Password     |
|-------|----------------|--------------|
| Admin | `admin`        | `Admin@12345` |

> User baru dibuat melalui halaman registrasi.

## 🤖 Setup Telegram Bot

1. Buka Telegram, cari **@BotFather**
2. Kirim `/newbot` dan ikuti instruksi untuk membuat bot
3. Salin **Bot Token** → masukkan ke `.env` (`TELEGRAM_BOT_TOKEN`)
4. Cari **@userinfobot** untuk mendapatkan **Chat ID** Anda
5. Masukkan Chat ID ke `.env` (`TELEGRAM_ADMIN_CHAT_ID`)
6. Kirim pesan ke bot Anda (klik Start) agar bot bisa mengirim pesan ke Anda
7. Restart server
8. Test dari Admin Dashboard → Pengaturan Telegram → Test Notifikasi

## 📡 API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint           | Deskripsi                     |
|--------|--------------------|-------------------------------|
| POST   | `/register`        | Registrasi user + auto login  |
| POST   | `/login`           | Login user                    |
| POST   | `/forgot-password` | Kirim OTP reset password      |
| POST   | `/verify-otp`      | Verifikasi OTP                |
| POST   | `/reset-password`  | Reset password baru           |
| GET    | `/me`              | Data user login (auth)        |

### Loans (`/api/loans`)
| Method | Endpoint     | Deskripsi                     |
|--------|--------------|-------------------------------|
| POST   | `/simulate`  | Simulasi pinjaman (public)    |
| POST   | `/apply`     | Ajukan pinjaman (auth user)   |
| GET    | `/my`        | Riwayat pinjaman user (auth)  |
| GET    | `/:id`       | Detail pinjaman (auth)        |

### User (`/api/user`) — semua butuh auth user
| Method | Endpoint                  | Deskripsi                |
|--------|---------------------------|--------------------------|
| GET    | `/dashboard`              | Ringkasan dashboard      |
| GET    | `/transactions`           | Riwayat transaksi        |
| GET    | `/notifications`          | Notifikasi               |
| PUT    | `/notifications/:id/read` | Tandai dibaca            |
| PUT    | `/profile`                | Update profil            |
| PUT    | `/settings`               | Ganti password           |
| POST   | `/upload-document`        | Upload KTP/dokumen       |

### Admin (`/api/admin`)
| Method | Endpoint                        | Deskripsi                     |
|--------|---------------------------------|-------------------------------|
| POST   | `/auth/login`                   | Login admin                   |
| GET    | `/me`                           | Data admin (auth admin)       |
| GET    | `/dashboard`                    | Statistik dashboard           |
| GET    | `/users`                        | List semua user               |
| GET    | `/users/:id`                    | Detail user                   |
| PUT    | `/users/:id`                    | Edit user (saldo, limit, dll) |
| PUT    | `/users/:id/status`             | Ubah status user              |
| DELETE | `/users/:id`                    | Hapus user                    |
| GET    | `/applications`                 | List pengajuan                |
| GET    | `/applications/:id`             | Detail pengajuan              |
| PUT    | `/applications/:id`             | Edit nominal/tenor            |
| PUT    | `/applications/:id/status`      | Approve/Reject/Disburse       |
| GET    | `/transactions`                 | List transaksi                |
| PUT    | `/transactions/:id/status`      | Approve/Reject transaksi      |
| GET    | `/settings`                     | Ambil settings                |
| PUT    | `/settings`                     | Update settings               |
| GET    | `/telegram/logs`                | Log telegram                  |
| POST   | `/telegram/test`                | Test notifikasi               |

## 🌐 Deploy ke Hosting

### Shared Hosting (cPanel)
1. Upload semua file ke `public_html/` (kecuali `node_modules`)
2. Setup MySQL database via cPanel → import `database/schema.sql`
3. Update `.env` dengan kredensial hosting
4. Jalankan `npm install` via SSH/Terminal
5. Setup Node.js app via cPanel (Port: 3000)
6. Buat admin: `node database/init.js`

### VPS / Cloud (PM2)
```bash
# Clone & install
git clone <repo> && cd SMART-FUND
npm install

# Setup database
npm run db:init

# Jalankan dengan PM2
npm install -g pm2
pm2 start server.js --name smartfund
pm2 save
pm2 startup

# Setup Nginx reverse proxy (opsional)
```

### Environment Variables untuk Production
```env
NODE_ENV=production
PORT=3000
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=smart_fund
JWT_SECRET=ganti_dengan_secret_yang_aman
SESSION_SECRET=ganti_dengan_secret_yang_aman
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ADMIN_CHAT_ID=your_chat_id
SITE_URL=https://yourdomain.com
```

## 📝 Demo OTP

Untuk keperluan demo, OTP menggunakan kode dummy:
- **Registrasi**: OTP Email & SMS = `123456`
- **Forgot Password**: OTP ditampilkan di response API & console

> Di production, integrasikan dengan email gateway (Nodemailer) dan SMS gateway.

## 📄 License

MIT License - bebas digunakan untuk keperluan komersial maupun edukasi.

## ⚠️ Disclaimer

SMART FUND adalah project demo/edukasi. Untuk produksi nyata, pastikan:
- Menggunakan HTTPS
- Mengintegrasikan payment gateway & verifikasi KYC
- Mengikuti regulasi OJK
- Audit keamanan profesional
- Backup database berkala

---

**SMART FUND** © 2026 - Pinjaman Online Terpercaya | Berizin & Diawasi OJK