import pool from './src/db.js';

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS procurement_plans (
          id CHAR(36) PRIMARY KEY,
          warehouse_id CHAR(36) NOT NULL,
          material_id CHAR(36) NOT NULL,
          year INT NOT NULL,
          total_quantity DECIMAL(12, 2) NOT NULL,
          quarterly_plans JSON,
          status ENUM('planned', 'ordered', 'received', 'approved') DEFAULT 'planned',
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_procplan_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sales_plans (
          id CHAR(36) PRIMARY KEY,
          factory_id CHAR(36) NOT NULL,
          product_id CHAR(36) NOT NULL,
          year INT NOT NULL,
          total_quantity DECIMAL(12, 2) NOT NULL,
          quarterly_plans JSON,
          status ENUM('draft', 'approved') DEFAULT 'draft',
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_salesplan_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Let's also add quarterly_plans JSON to production_plans if it's missing so we can just store the JSON directly!
    // And drop production_plan_details.
    
    // Check if column exists
    const [cols] = await connection.query("SHOW COLUMNS FROM production_plans LIKE 'quarterly_plans'");
    if (cols.length === 0) {
      await connection.query("ALTER TABLE production_plans ADD COLUMN quarterly_plans JSON");
    }

    console.log("Planning tables created/updated successfully");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
