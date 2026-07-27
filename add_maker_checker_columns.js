import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import pool from './src/config/db.config.js';

async function addColumns() {
  const tables = [
    'financial_plans',
    'sales_plans',
    'procurement_plans',
    'production_plans',
    'expenses',
    'leave_requests',
    'purchase_orders',
    'purchase_requisitions',
    'suppliers',
    'fleet_requests'
  ];

  for (const table of tables) {
    try {
      console.log(`Checking table: ${table}`);
      await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`status\` varchar(50) DEFAULT 'pending'`);
      console.log(`Added status to ${table}`);
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error(`Error adding status to ${table}:`, e.message);
    }
    try {
      await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`created_by\` char(36) DEFAULT NULL`);
      console.log(`Added created_by to ${table}`);
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error(`Error adding created_by to ${table}:`, e.message);
    }
    try {
      await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`approved_by\` char(36) DEFAULT NULL`);
      console.log(`Added approved_by to ${table}`);
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error(`Error adding approved_by to ${table}:`, e.message);
    }
  }
  process.exit(0);
}

addColumns();
