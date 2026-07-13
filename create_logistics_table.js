import pool from './src/db.js';

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS logistics_shipments (
          id CHAR(36) PRIMARY KEY,
          company_id CHAR(36) NOT NULL,
          order_id VARCHAR(100),
          status ENUM('pending', 'in_transit', 'delivered') DEFAULT 'pending',
          delivery_date DATE,
          temperature_log JSON,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_logisticsshipment_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log("Logistics shipments table created successfully");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
