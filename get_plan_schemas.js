import pool from './src/config/db.config.js';
async function run() {
  const tables = ['production_plans', 'procurement_plans', 'sales_plans', 'financial_plans'];
  for (const table of tables) {
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM ${table}`);
      console.log(`\n--- ${table} ---`);
      console.log(cols.map(c => `${c.Field} ${c.Type} default:${c.Default}`).join('\n'));
    } catch(e) { console.error(`Error on ${table}: ${e.message}`); }
  }
  process.exit(0);
}
run();
