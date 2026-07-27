import pool from './src/config/db.config.js';
async function run() {
  const [cols] = await pool.query('SHOW COLUMNS FROM financial_plans');
  console.log(cols.map(c => c.Field));
  process.exit(0);
}
run();
