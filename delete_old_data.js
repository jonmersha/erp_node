import pool from './src/db.js';

async function deleteData() {
  try {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    const tables = [
      'grns',
      'inventory_transactions',
      'inventory',
      'packaging_logs',
      'milling_logs',
      'grain_intake_logs',
      'production_events',
      'production_run_stages',
      'production_runs'
    ];
    
    for (const table of tables) {
      try {
        await pool.query(`DELETE FROM ${table};`);
        console.log(`Cleared ${table}`);
      } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          console.log(`Skipped ${table} (does not exist)`);
        } else {
          console.error(`Error clearing ${table}:`, err.message);
        }
      }
    }

    await pool.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('All specified data deleted successfully.');
  } catch (error) {
    console.error('Error deleting data:', error);
  } finally {
    process.exit();
  }
}

deleteData();
