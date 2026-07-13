import pool from './src/db.js';

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          company_id CHAR(36) NOT NULL,
          CONSTRAINT fk_category_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log("Categories table created successfully");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
