import 'dotenv/config';
import pool from './src/db.js';

const initRoles = async () => {
  try {
    console.log('Creating roles table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          permissions JSON,
          is_system BOOLEAN DEFAULT FALSE,
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_role_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          UNIQUE KEY uk_role_name_company (name, company_id)
      ) ENGINE=InnoDB;
    `);
    console.log('Roles table created successfully.');
  } catch (err) {
    console.error('Error creating roles table:', err);
  } finally {
    process.exit(0);
  }
};

initRoles();
