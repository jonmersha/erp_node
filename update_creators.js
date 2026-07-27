import pool from './src/config/db.config.js';

async function run() {
  const tables = [
    'production_plans', 'procurement_plans', 'sales_plans', 'financial_plans',
    'purchase_orders', 'purchase_requisitions', 'suppliers'
  ];
  const uid = 'fhjv2MxB39fm4WsE2XfiZIpNS072';

  for (const table of tables) {
    try {
      // Find the column name for creator (created_by or createdBy)
      const [columns] = await pool.query(`SHOW COLUMNS FROM ${table}`);
      const colNames = columns.map(c => c.Field);
      let creatorCol = null;
      if (colNames.includes('created_by')) creatorCol = 'created_by';
      else if (colNames.includes('createdBy')) creatorCol = 'createdBy';

      if (creatorCol) {
        const [result] = await pool.query(`UPDATE ${table} SET ${creatorCol} = ? WHERE ${creatorCol} IS NULL OR ${creatorCol} = ''`, [uid]);
        console.log(`Updated ${result.affectedRows} rows in ${table}`);
      } else {
        console.log(`No creator column found in ${table}`);
      }
    } catch (err) {
      console.log(`Error on table ${table}: ${err.message}`);
    }
  }
  process.exit(0);
}
run();
