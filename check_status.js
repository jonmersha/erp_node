import pool from './src/config/db.config.js';

async function run() {
  try {
    const [rows] = await pool.query("SHOW COLUMNS FROM suppliers WHERE Field = 'status'");
    console.log(rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
