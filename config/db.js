/**
 * SMART FUND - Database Connection (MySQL Pool)
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DATABASE_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DATABASE_PORT || '3306', 10);
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DATABASE_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.DATABASE_PASSWORD || '';
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DB || process.env.DATABASE_NAME || 'smart_fund';

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
    console.log('[DB] Connected to MySQL database:', process.env.DB_NAME || 'smart_fund');
    conn.release();
  } catch (err) {
    console.error('[DB] MySQL connection error:', err.message);
    console.error('      Jalankan: npm run db:init  lalu  npm start');
  }
})();

module.exports = pool;