import pool from './src/db.js';

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
          id CHAR(36) PRIMARY KEY,
          company_id CHAR(36) NOT NULL,
          equipment_id VARCHAR(100),
          date DATE,
          description TEXT,
          technician VARCHAR(100),
          cost DECIMAL(12, 2),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_maintenancelog_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log("Maintenance logs table created successfully");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
