import pool from './src/db.js';

async function run() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active';");
    console.log("Column status added to users.");
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Column status already exists in users table.");
    } else {
      console.error("Error:", error.message);
    }
  } finally {
    process.exit();
  }
}

run();
