import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import pool from './src/db.js';

async function run() {
  try {
    const [rows] = await pool.query('DESCRIBE purchase_requisitions');
    console.log(rows);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
