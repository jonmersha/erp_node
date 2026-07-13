import pool from './src/db.js';

async function run() {
  try {
    await pool.query("ALTER TABLE products ADD COLUMN image_url TEXT;");
    console.log("Column image_url added to products.");
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Column image_url already exists in products table.");
    } else {
      console.error("Error:", error.message);
    }
  } finally {
    process.exit();
  }
}

run();
