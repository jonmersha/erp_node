import pool from './src/config/db.config.js';

async function run() {
  try {
    console.log("Altering production_plans...");
    await pool.query("ALTER TABLE production_plans MODIFY COLUMN status ENUM('draft', 'pending_approval', 'approved', 'rejected') DEFAULT 'draft'");

    console.log("Altering sales_plans...");
    await pool.query("ALTER TABLE sales_plans MODIFY COLUMN status ENUM('draft', 'pending_approval', 'approved', 'rejected') DEFAULT 'draft'");

    console.log("Altering procurement_plans...");
    await pool.query("ALTER TABLE procurement_plans MODIFY COLUMN status ENUM('draft', 'pending_approval', 'approved', 'rejected', 'planned', 'ordered', 'received') DEFAULT 'draft'");

    console.log("Altering financial_plans...");
    // Add columns if they don't exist
    const [finCols] = await pool.query("SHOW COLUMNS FROM financial_plans");
    const finColNames = finCols.map(c => c.Field);
    
    if (!finColNames.includes('status')) {
      await pool.query("ALTER TABLE financial_plans ADD COLUMN status ENUM('draft', 'pending_approval', 'approved', 'rejected') DEFAULT 'draft'");
    } else {
      await pool.query("ALTER TABLE financial_plans MODIFY COLUMN status ENUM('draft', 'pending_approval', 'approved', 'rejected') DEFAULT 'draft'");
    }
    
    if (!finColNames.includes('created_by')) {
      await pool.query("ALTER TABLE financial_plans ADD COLUMN created_by VARCHAR(36) DEFAULT NULL");
    }
    
    if (!finColNames.includes('approved_by')) {
      await pool.query("ALTER TABLE financial_plans ADD COLUMN approved_by VARCHAR(36) DEFAULT NULL");
    }

    console.log("All schemas updated successfully.");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
