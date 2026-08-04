/**
 * SMART FUND - Database Initialization Script
 * Menjalankan schema.sql dan membuat admin default
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function initDatabase() {
  // Parse DATABASE_URL if present (Railway format: mysql://user:pass@host:port/db)
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_PRIVATE_URL || '';

  let host = 'localhost';
  let port = 3306;
  let user = 'root';
  let password = '';
  let database = 'smart_fund';

  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      host = url.hostname;
      port = parseInt(url.port || '3306', 10);
      user = decodeURIComponent(url.username || 'root');
      password = decodeURIComponent(url.password || '');
      database = url.pathname.replace(/^\//, '') || 'smart_fund';
    } catch (err) {
      console.error('[DB] Failed to parse DATABASE_URL:', err.message);
    }
  } else {
    host = process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DATABASE_HOST || 'localhost';
    port = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DATABASE_PORT || '3306', 10);
    user = process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DATABASE_USER || 'root';
    password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.DATABASE_PASSWORD || '';
    database = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DB || process.env.DATABASE_NAME || 'smart_fund';
  }

  console.log('============================================');
  console.log('  SMART FUND - Database Initialization');
  console.log('============================================\n');

  // 1. Connect to MySQL server (with database if exists)
  let conn;
  try {
    conn = await mysql.createConnection({ host, port, user, password, database, multipleStatements: true });
    console.log('[OK] Connected to MySQL server');
  } catch (err) {
    // Try connecting without database (for local dev where DB doesn't exist yet)
    try {
      conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
      console.log('[OK] Connected to MySQL server (without database)');
    } catch (err2) {
      console.error('[ERROR] Cannot connect to MySQL:', err.message);
      console.error('       Pastikan MySQL berjalan dan kredensial di .env benar.');
      process.exit(1);
    }
  }

  // 2. Run schema.sql (strip CREATE DATABASE & USE for Railway compatibility)
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    let sql = fs.readFileSync(schemaPath, 'utf8');

    // Remove CREATE DATABASE and USE statements (Railway provides the database)
    sql = sql.replace(/CREATE DATABASE[^;]*;/gi, '');
    sql = sql.replace(/USE\s+[^;]*;/gi, '');

    // Ensure database exists (for local dev)
    try {
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await conn.query(`USE \`${database}\``);
    } catch (dbErr) {
      // Railway user may not have CREATE DATABASE permission - that's OK
      console.log('[INFO] Database already exists or no permission to create (Railway mode)');
    }

    await conn.query(sql);
    console.log('[OK] Schema executed (tables created)');
  } catch (err) {
    console.error('[ERROR] Failed to execute schema:', err.message);
    process.exit(1);
  }

  // 3. Create default admin
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@smartfund.id';
    const adminFullName = process.env.ADMIN_FULL_NAME || 'Super Admin';

    const [rows] = await conn.query('SELECT id FROM admins WHERE username = ?', [adminUsername]);
    if (rows.length === 0) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await conn.query(
        `INSERT INTO admins (username, email, password_hash, full_name, role, status)
         VALUES (?, ?, ?, ?, 'super_admin', 'active')`,
        [adminUsername, adminEmail, hash, adminFullName]
      );
      console.log(`[OK] Default admin created -> username: ${adminUsername} | password: ${adminPassword}`);
    } else {
      console.log('[SKIP] Default admin already exists');
    }
  } catch (err) {
    console.error('[ERROR] Failed to create admin:', err.message);
  }

  await conn.end();
  console.log('\n[DONE] Database initialization complete.');
  console.log('       Jalankan: npm start');
}

initDatabase().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});