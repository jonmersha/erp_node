import pool from './src/db.js';

async function run() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        performed_by VARCHAR(100) NOT NULL,
        company_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    console.log("Table audit_logs created or already exists.");
  } catch (error) {
    console.error("Error creating audit_logs table:", error.message);
  } finally {
    process.exit();
  }
}

run();
