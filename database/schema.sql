-- ============================================
-- SMART FUND - Database Schema (MySQL)
-- Platform Pinjaman Online Terpercaya
-- ============================================

CREATE DATABASE IF NOT EXISTS smart_fund
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_fund;

-- --------------------------------------------
-- Table: admins
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
   full_name VARCHAR(100),
   cs_code VARCHAR(50) NOT NULL UNIQUE,
   role ENUM('super_admin','admin','operator') DEFAULT 'admin',
  status ENUM('active','inactive') DEFAULT 'active',
  last_login DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- --------------------------------------------
-- Table: users
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nik VARCHAR(32) NULL,
  address TEXT NULL,
  job VARCHAR(100) NULL,
  income_range VARCHAR(50) NULL,
  balance DECIMAL(15,2) DEFAULT 0.00,
  loan_limit DECIMAL(15,2) DEFAULT 5000000.00,
   cs_id INT NULL,
   status ENUM('active','frozen','pending','inactive') DEFAULT 'active',
   ktp_filename VARCHAR(255) NULL,
   remember_token VARCHAR(255) NULL,
   last_login DATETIME NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   INDEX idx_email (email),
   INDEX idx_phone (phone),
   INDEX idx_status (status),
   INDEX idx_cs (cs_id),
   FOREIGN KEY (cs_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- --------------------------------------------
-- Table: loan_applications
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS loan_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cs_id INT NULL,
  cs_code VARCHAR(50) NULL,
  amount DECIMAL(15,2) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  tenor INT NOT NULL,
  monthly_payment DECIMAL(15,2) NOT NULL,
  total_interest DECIMAL(15,2) NOT NULL,
  total_payment DECIMAL(15,2) NOT NULL,
  status ENUM('pending','approved','rejected','disbursed','completed') DEFAULT 'pending',
  admin_note TEXT NULL,
  approved_at DATETIME NULL,
  rejected_at DATETIME NULL,
  disbursed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (cs_id) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_user (user_id),
  INDEX idx_cs (cs_id)
) ENGINE=InnoDB;

-- --------------------------------------------
-- Table: transactions
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  loan_id INT NULL,
  type ENUM('disbursement','repayment','withdrawal','admin_adjustment') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status ENUM('pending','approved','rejected','completed') DEFAULT 'pending',
  description VARCHAR(255) NULL,
  admin_note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (loan_id) REFERENCES loan_applications(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_type (type),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- --------------------------------------------
-- Table: notifications
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','success','warning','error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_read (is_read)
) ENGINE=InnoDB;

-- --------------------------------------------
-- Table: withdrawals
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS withdrawals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  withdrawal_id VARCHAR(20) NOT NULL UNIQUE,
  member_id INT NOT NULL,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  no_hp VARCHAR(20) NOT NULL,
  bank VARCHAR(50) NOT NULL,
  no_rekening VARCHAR(50) NOT NULL,
  nama_rekening VARCHAR(100) NOT NULL,
  jumlah DECIMAL(15,2) NOT NULL,
  status ENUM('menunggu_verifikasi','diproses','berhasil','ditolak') DEFAULT 'menunggu_verifikasi',
  catatan TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_member (member_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- --------------------------------------------
-- Table: settings
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  description VARCHAR(255) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- --------------------------------------------
-- Table: telegram_logs
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS telegram_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chat_id VARCHAR(50) NULL,
  message TEXT NOT NULL,
  status ENUM('sent','failed') DEFAULT 'sent',
  error_message TEXT NULL,
  payload TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- --------------------------------------------
-- Table: password_resets
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  token VARCHAR(255) NOT NULL,
  otp VARCHAR(10) NULL,
  expires_at DATETIME NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_token (token)
) ENGINE=InnoDB;

-- --------------------------------------------
-- Default Settings
-- --------------------------------------------
INSERT INTO settings (setting_key, setting_value, description) VALUES
  ('site_name', 'SMART FUND', 'Nama website'),
  ('site_tagline', 'Pinjaman Online Terpercaya', 'Tagline website'),
  ('min_loan', '1000000', 'Pinjaman minimum'),
  ('max_loan', '500000000', 'Pinjaman maksimum'),
  ('min_tenor', '6', 'Tenor minimum (bulan)'),
  ('max_tenor', '60', 'Tenor maksimum (bulan)'),
  ('interest_rate', '5', 'Bunga per tahun (%)'),
  ('default_loan_limit', '200000000', 'Limit pinjaman default user baru'),
  ('min_withdrawal', '100000', 'Minimum penarikan dana (Rp)'),
  ('telegram_enabled', 'true', 'Aktifkan notifikasi Telegram'),
  ('maintenance_mode', 'false', 'Mode pemeliharaan'),
  ('contact_email', 'cs@smartfund.id', 'Email kontak'),
  ('contact_phone', '0800-1234-5678', 'Telepon kontak')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- --------------------------------------------
-- Default Admin (password: Admin@12345)
-- NOTE: password_hash di-generate oleh bcrypt pada saat init.js
-- cs_code di-generate oleh init.js sebagai CS01
-- --------------------------------------------