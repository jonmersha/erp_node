import pool from './src/db.js';

async function run() {
  try {
    await pool.query('ALTER TABLE purchase_orders ADD COLUMN warehouse_id CHAR(36) AFTER factory_id;');
    console.log('Column warehouse_id added to purchase_orders.');
    await pool.query('ALTER TABLE purchase_orders MODIFY COLUMN factory_id CHAR(36) NULL;');
    console.log('Column factory_id made nullable.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

run();
