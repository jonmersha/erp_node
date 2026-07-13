import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

console.log('Database Config:', {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  database: process.env.MYSQL_DATABASE || 'enterprise_db',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
});

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'enterprise_db',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
