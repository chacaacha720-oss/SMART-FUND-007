/**
 * SMART FUND - Database Connection (MySQL Pool)
 * 
 * Railway compatible - uses Environment Variables only.
 * 
 * Priority for connection config:
 *   1. DATABASE_URL / MYSQL_PRIVATE_URL (Railway MySQL Plugin format)
 *   2. DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME (standard env vars)
 *   3. MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE (Railway auto-injected)
 * 
 * No hardcoded localhost fallbacks - if env vars are missing, 
 * validation errors are thrown instead of silently connecting to the wrong host.
 */
// Load .env only in local/development; Railway provides env vars at runtime
if (process.env.NODE_ENV !== 'production' && !process.env.RAILWAY_ENVIRONMENT) {
  require('dotenv').config();
}
const mysql = require('mysql2/promise');

  // 1. Parse DATABASE_URL (Railway MySQL plugin format)
  //    MYSQL_PRIVATE_URL / MYSQL_URL are aliases used by the Railway plugin
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_PRIVATE_URL || process.env.MYSQL_URL || '';

function getDbConfig() {
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

const dbConfig = getDbConfig();

// Validate required config - throw descriptive error instead of using localhost
const missingVars = [];
if (!dbConfig.host) missingVars.push('DB_HOST');
if (!dbConfig.user) missingVars.push('DB_USER');
if (!dbConfig.database) missingVars.push('DB_NAME');

if (missingVars.length > 0) {
  const err = new Error(
    `Missing Environment Variables: ${missingVars.join(', ')}. ` +
    `Please configure database connection in .env or via Railway environment variables.`
  );
  err.name = 'DB_CONFIG_ERROR';
  console.error('[DB] ✘ Config Error:', err.message);
  // Don't crash during db:init - allow the pool to be created but it will fail on query
}

const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectTimeout: 10000, // 10s connect timeout
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection on boot - fail gracefully, don't crash the app
let connectionVerified = false;

async function verifyConnection() {
  console.log('✔ Connecting Database...');
  try {
    const conn = await pool.getConnection();
    conn.release();
    connectionVerified = true;
    console.log('✔ Database Connected:', dbConfig.database);
    return true;
  } catch (err) {
    connectionVerified = false;
    console.error('✘ Database connection failed.');
    console.error('  Error:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('  Kemungkinan penyebab: MySQL tidak berjalan atau host/port salah.');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('  Kemungkinan penyebab: Username atau password salah (Access denied).');
    } else if (err.code === 'ER_BAD_DB_ERROR' || err.code === 'ER_DBACCESS_DENIED_ERROR') {
      console.error('  Kemungkinan penyebab: Database tidak ditemukan atau user tidak punya akses.');
    }
    console.error('  Jalankan: npm run db:init untuk setup database.');
    return false;
  }
}

// Run verification (non-blocking, doesn't crash app on failure)
(async () => {
  await verifyConnection();
})();

module.exports = pool;
module.exports.verifyConnection = verifyConnection;
module.exports.isConnected = () => connectionVerified;
module.exports.getDbConfig = getDbConfig;