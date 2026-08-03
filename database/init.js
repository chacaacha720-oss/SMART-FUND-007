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
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'smart_fund';

  console.log('============================================');
  console.log('  SMART FUND - Database Initialization');
  console.log('============================================\n');

  // 1. Connect without database to create it
  let conn;
  try {
    conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
    console.log('[OK] Connected to MySQL server');
  } catch (err) {
    console.error('[ERROR] Cannot connect to MySQL:', err.message);
    console.error('       Pastikan MySQL berjalan dan kredensial di .env benar.');
    process.exit(1);
  }

  // 2. Run schema.sql
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await conn.query(sql);
    console.log('[OK] Schema executed (database & tables created)');
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