import pool from './src/config/db.config.js';
import fs from 'fs';

const tables = [
  'production_plans',
  'procurement_plans',
  'sales_plans',
  'financial_plans',
  'purchase_orders',
  'purchase_requisitions'
];

async function alterTables() {
  for (const table of tables) {
    try {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN rejection_reason TEXT DEFAULT NULL`);
      console.log(`Added rejection_reason to ${table}`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`Column rejection_reason already exists in ${table}`);
      } else {
        console.error(`Error altering ${table}:`, e.message);
      }
    }
  }
  process.exit(0);
}

alterTables();
