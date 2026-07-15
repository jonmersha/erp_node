import pool from './src/db.js';

async function alterTable() {
  try {
    await pool.query('ALTER TABLE production_run_stages ADD COLUMN quantity_produced DECIMAL(10,2) DEFAULT NULL;');
    console.log('Added quantity_produced column successfully');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
    } else {
      console.error('Error altering table:', error);
    }
  }
  process.exit();
}

alterTable();
