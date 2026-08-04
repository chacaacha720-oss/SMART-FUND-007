/**
 * SMART FUND - Database Connection (MySQL Pool)
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

// Parse DATABASE_URL if present (Railway format: mysql://user:pass@host:port/db)
const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_PRIVATE_URL || '';

let dbHost = 'localhost';
let dbPort = 3306;
let dbUser = 'root';
let dbPassword = '';
let dbName = 'smart_fund';

if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    dbHost = url.hostname;
    dbPort = parseInt(url.port || '3306', 10);
    dbUser = decodeURIComponent(url.username || 'root');
    dbPassword = decodeURIComponent(url.password || '');
    dbName = url.pathname.replace(/^\//, '') || 'smart_fund';
  } catch (err) {
    console.error('[DB] Failed to parse DATABASE_URL:', err.message);
  }
} else {
  dbHost = process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DATABASE_HOST || 'localhost';
  dbPort = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DATABASE_PORT || '3306', 10);
  dbUser = process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DATABASE_USER || 'root';
  dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.DATABASE_PASSWORD || '';
  dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DB || process.env.DATABASE_NAME || 'smart_fund';
}

const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
});

// Test connection on boot
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('[DB] Connected to MySQL database:', dbName);
    conn.release();
  } catch (err) {
    console.error('[DB] MySQL connection error:', err.message);
    console.error('      Jalankan: npm run db:init  lalu  npm start');
  }
})();

module.exports = pool;