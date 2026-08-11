/**
 * SMART FUND - Database Initialization Script
 * Menjalankan schema.sql dan membuat admin default
 * Railway compatible - uses Environment Variables only.
 */
// Load .env only in local/development; Railway provides env vars at runtime
if (process.env.NODE_ENV !== 'production' && !process.env.RAILWAY_ENVIRONMENT) {
  require('dotenv').config();
}
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

function getDbConfig() {
  // Parse DATABASE_URL if present (Railway format: mysql://user:pass@host:port/db)
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_PRIVATE_URL || process.env.MYSQL_URL || '';

  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port || '3306', 10),
        user: decodeURIComponent(url.username || ''),
        password: decodeURIComponent(url.password || ''),
        database: url.pathname.replace(/^\//, '') || '',
      };
    } catch (err) {
      console.error('[DB] Failed to parse DATABASE_URL:', err.message);
    }
  }

  return {
    host: process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DATABASE_HOST || '',
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DATABASE_PORT || '3306', 10),
    user: process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DATABASE_USER || '',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.DATABASE_PASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DB || process.env.DATABASE_NAME || '',
  };
}

async function initDatabase() {
  const { host, port, user, password, database } = getDbConfig();

  console.log('============================================');
  console.log('  SMART FUND - Database Initialization');
  console.log('============================================\n');

  // Validate required config - fail fast with clear error
  const missingVars = [];
  if (!host) missingVars.push('DB_HOST');
  if (!user) missingVars.push('DB_USER');
  if (!database) missingVars.push('DB_NAME');

  if (missingVars.length > 0) {
    console.error(`[ERROR] Missing Environment Variables: ${missingVars.join(', ')}`);
    console.error('       Pastikan .env atau variabel Railway sudah di-set dengan benar.');
    console.error(`       DB_PORT: ${port}, DB_PASSWORD: ${password ? '***' : '(kosong)'}`);
    process.exit(1);
  }

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
      if (err2.code === 'ECONNREFUSED') {
        console.error('       Kemungkinan penyebab: MySQL tidak berjalan atau host/port salah.');
      } else if (err2.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('       Kemungkinan penyebab: Username atau password salah (Access denied).');
      }
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

    // 2b. Auto-migrate: add new columns to existing tables (no-op if already present)
    const migrations = [
      { table: 'admins', col: 'cs_code', definition: 'VARCHAR(50)' },
      { table: 'users', col: 'cs_id', definition: 'INT NULL' },
      { table: 'loan_applications', col: 'cs_id', definition: 'INT NULL' },
      { table: 'loan_applications', col: 'cs_code', definition: 'VARCHAR(50) NULL' },
    ];

    for (const m of migrations) {
      try {
        const [check] = await conn.query(
          'SELECT COUNT(*) as cnt FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
          [m.table, m.col]
        );
        if (check[0].cnt === 0) {
          await conn.query(`ALTER TABLE ${m.table} ADD COLUMN ${m.col} ${m.definition}`);
          console.log(`[OK] Migrated: added ${m.col} to ${m.table}`);
        }
      } catch (merr) {
        console.error(`[WARN] Migration failed for ${m.table}.${m.col}:`, merr.message);
      }
    }

     // Add indexes for cs_id if not exists
     try {
       const [idxCheck] = await conn.query(
         "SELECT COUNT(*) as cnt FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_cs'"
       );
       if (idxCheck[0].cnt === 0) {
         await conn.query('ALTER TABLE users ADD INDEX idx_cs (cs_id)');
         console.log('[OK] Migrated: added idx_cs to users');
       }
     } catch (merr) { console.error('[WARN] Index migration failed:', merr.message); }

     try {
       const [idxCheck2] = await conn.query(
         "SELECT COUNT(*) as cnt FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'loan_applications' AND index_name = 'idx_cs'"
       );
       if (idxCheck2[0].cnt === 0) {
         await conn.query('ALTER TABLE loan_applications ADD INDEX idx_cs (cs_id)');
         console.log('[OK] Migrated: added idx_cs to loan_applications');
       }
     } catch (merr) { console.error('[WARN] Index migration failed:', merr.message); }
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
      const hash = await bcrypt.hash(adminPassword, 12);

      // Generate cs_code: CS + 2-digit zero-padded number (CS01, CS02, ..., CS99)
      const [codeRows] = await conn.query("SELECT IFNULL(MAX(id), 0) + 1 AS next_id FROM admins");
      const nextId = codeRows[0].next_id;
      const csCode = 'CS' + String(nextId).padStart(2, '0');

      await conn.query(
        `INSERT INTO admins (username, email, password_hash, full_name, cs_code, role, status)
         VALUES (?, ?, ?, ?, ?, 'super_admin', 'active')`,
        [adminUsername, adminEmail, hash, adminFullName, csCode]
      );
      console.log(`[OK] Default admin created -> username: ${adminUsername} | password: ${adminPassword} | cs_code: ${csCode}`);
    } else {
      console.log('[SKIP] Default admin already exists');
    }
  } catch (err) {
    console.error('[ERROR] Failed to create admin:', err.message);
  }

   // 3b. Ensure existing admins have cs_code
   try {
     const [adminRows] = await conn.query('SELECT id, cs_code FROM admins ORDER BY id ASC');
     for (const a of adminRows) {
       if (!a.cs_code || a.cs_code === '') {
         const code = 'CS' + String(a.id).padStart(2, '0');
         await conn.query('UPDATE admins SET cs_code = ? WHERE id = ?', [code, a.id]);
         console.log(`[OK] Assigned cs_code ${code} to admin id=${a.id}`);
       }
     }
   } catch (err) {
     console.error('[ERROR] Failed to backfill cs_code:', err.message);
   }

  await conn.end();
  console.log('\n[DONE] Database initialization complete.');
  console.log('       Jalankan: npm start');
}

initDatabase().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});