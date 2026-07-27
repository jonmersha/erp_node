import pool from './src/config/db.config.js';

async function run() {
  try {
    console.log("Altering status ENUM in suppliers table...");
    await pool.query("ALTER TABLE suppliers MODIFY COLUMN status ENUM('active', 'inactive', 'pending', 'pending_approval') DEFAULT 'pending_approval'");
    console.log("Done.");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
