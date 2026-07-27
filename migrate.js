import dotenv from 'dotenv';
dotenv.config();

import pool from './src/config/db.config.js';

async function migrate() {
  try {
    await pool.query("ALTER TABLE non_conformance_reports ADD COLUMN rca_details text DEFAULT NULL;");
    await pool.query("ALTER TABLE non_conformance_reports ADD COLUMN capa_details text DEFAULT NULL;");
    await pool.query("ALTER TABLE non_conformance_reports ADD COLUMN disposition enum('pending','quarantine','rework','disposal','accept_as_is','return_to_vendor') NOT NULL DEFAULT 'pending';");
    console.log("Migration applied.");
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Field already exists.");
      process.exit(0);
    } else {
      console.error(err);
      process.exit(1);
    }
  }
}
migrate();
