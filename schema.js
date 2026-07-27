import pool from './src/config/db.config.js';
async function run() {
  const [columns] = await pool.query('SHOW COLUMNS FROM production_plans');
  console.log(columns.map(c => c.Field));
  process.exit(0);
}
run();
