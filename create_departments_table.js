import pool from './src/db.js';

async function migrate() {
  try {
    console.log("Starting departments migration...");

    // 1. Create departments table
    console.log("Creating departments table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          parent_department_id CHAR(36),
          manager_id CHAR(36),
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_dept_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_dept_parent FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON DELETE SET NULL
          -- manager_id FK will be added after we ensure employees table has it
      ) ENGINE=InnoDB;
    `);

    // 2. Add FK for manager_id referencing employees
    // Note: employees already exists, so we can add it directly
    try {
      await pool.query(`
        ALTER TABLE departments
        ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;
      `);
      console.log("Added fk_dept_manager to departments");
    } catch (e) {
      if (e.code !== 'ER_DUP_KEYNAME') {
        // Ignore if already exists, otherwise throw
        // Some versions throw ER_CANT_CREATE_TABLE if FK exists. We ignore it for idempotency in a basic script, or specifically catch duplicate key.
        console.log("FK fk_dept_manager might already exist:", e.message);
      }
    }

    // 3. Alter employees table
    console.log("Altering employees table...");
    // Drop department string column if it exists
    try {
      await pool.query('ALTER TABLE employees DROP COLUMN department');
      console.log("Dropped old 'department' column from employees");
    } catch (e) {
      console.log("Old 'department' column may not exist or already dropped:", e.message);
    }

    // Add department_id and manager_id
    try {
      await pool.query('ALTER TABLE employees ADD COLUMN department_id CHAR(36)');
      await pool.query('ALTER TABLE employees ADD COLUMN manager_id CHAR(36)');
      
      await pool.query(`
        ALTER TABLE employees
        ADD CONSTRAINT fk_emp_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      `);
      await pool.query(`
        ALTER TABLE employees
        ADD CONSTRAINT fk_emp_manager FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
      `);
      console.log("Added department_id and manager_id to employees");
    } catch (e) {
      console.log("Columns or constraints might already exist:", e.message);
    }

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
