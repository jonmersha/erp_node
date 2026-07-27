import pool from './src/config/db.config.js';
async function run() {
  const [rows] = await pool.query('SELECT id, status, created_by, approved_by FROM production_plans');
  console.log(rows);
  process.exit(0);
}
run();
