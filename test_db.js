import pool from './src/db.js';
async function run() {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    console.log(rows);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
run();
