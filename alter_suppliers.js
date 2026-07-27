import pool from './src/config/db.config.js';

async function run() {
  try {
    console.log("Checking columns in suppliers table...");
    const [columns] = await pool.query("SHOW COLUMNS FROM suppliers");
    const colNames = columns.map(c => c.Field);
    
    const alterQueries = [];
    if (!colNames.includes('category')) alterQueries.push("ALTER TABLE suppliers ADD COLUMN category VARCHAR(255);");
    if (!colNames.includes('risk_rating')) alterQueries.push("ALTER TABLE suppliers ADD COLUMN risk_rating INT DEFAULT 3;");
    if (!colNames.includes('payment_terms')) alterQueries.push("ALTER TABLE suppliers ADD COLUMN payment_terms VARCHAR(255);");
    if (!colNames.includes('bank_account')) alterQueries.push("ALTER TABLE suppliers ADD COLUMN bank_account VARCHAR(255);");
    if (!colNames.includes('tax_id')) alterQueries.push("ALTER TABLE suppliers ADD COLUMN tax_id VARCHAR(255);");

    for (let q of alterQueries) {
      console.log("Running:", q);
      await pool.query(q);
    }
    console.log("Done.");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
