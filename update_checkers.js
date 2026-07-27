import pool from './src/config/db.config.js';

async function run() {
  const tables = [
    'production_plans', 'procurement_plans', 'sales_plans', 'financial_plans',
    'purchase_orders', 'purchase_requisitions', 'suppliers'
  ];
  const uid = 'fhjv2MxB39fm4WsE2XfiZIpNS072';

  for (const table of tables) {
    try {
      const [columns] = await pool.query(`SHOW COLUMNS FROM ${table}`);
      const colNames = columns.map(c => c.Field);
      let approverCol = null;
      if (colNames.includes('approved_by')) approverCol = 'approved_by';
      else if (colNames.includes('approvedBy')) approverCol = 'approvedBy';

      if (approverCol) {
        const [result] = await pool.query(`UPDATE ${table} SET ${approverCol} = ? WHERE status = 'approved' AND (${approverCol} IS NULL OR ${approverCol} = '')`, [uid]);
        console.log(`Updated ${result.affectedRows} rows in ${table}`);
      } else {
        console.log(`No checker column found in ${table}`);
      }
    } catch (err) {
      console.log(`Error on table ${table}: ${err.message}`);
    }
  }
  process.exit(0);
}
run();
