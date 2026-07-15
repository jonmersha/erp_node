import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT,
  });
  
  try {
    await pool.query("DROP TABLE IF EXISTS production_events");
    console.log("Success!");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
