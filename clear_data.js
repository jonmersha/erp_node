import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const clearDb = async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    });

    const dbName = process.env.MYSQL_DATABASE || 'erpsystem';
    console.log(`Dropping database: ${dbName}`);
    await pool.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
    
    console.log(`Recreating database: ${dbName}`);
    await pool.query(`CREATE DATABASE \`${dbName}\`;`);
    
    console.log('Database successfully cleared and recreated!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to clear database:', err);
    process.exit(1);
  }
};

clearDb();
