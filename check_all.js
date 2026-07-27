import pool from './src/config/db.config.js';
async function run() {
  const tables = [
    'production_plans', 'procurement_plans', 'sales_plans', 'financial_plans',
    'purchase_orders', 'purchase_requisitions', 'suppliers'
  ];
  for (const table of tables) {
    const [cols] = await pool.query(`SHOW COLUMNS FROM ${table}`);
    const colNames = cols.map(c => c.Field);
    console.log(`${table}: created=${colNames.includes('created_by') || colNames.includes('createdBy')}, approved=${colNames.includes('approved_by') || colNames.includes('approvedBy')}`);
  }
  process.exit(0);
}
run();
