import pool from './src/db.js';

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS finance_invoices (
        id CHAR(36) PRIMARY KEY,
        company_id CHAR(36) NOT NULL,
        order_id VARCHAR(100),
        order_type ENUM('purchase', 'sales'),
        amount DECIMAL(15, 2),
        due_date DATE,
        status ENUM('draft', 'issued', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_fin_inv_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS finance_payments (
        id CHAR(36) PRIMARY KEY,
        company_id CHAR(36) NOT NULL,
        invoice_id CHAR(36) NOT NULL,
        amount DECIMAL(15, 2),
        payment_date DATE,
        payment_method ENUM('cash', 'bank_transfer', 'check', 'credit_card'),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_fin_pay_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS financial_plans (
        id CHAR(36) PRIMARY KEY,
        company_id CHAR(36) NOT NULL,
        year INT NOT NULL,
        quarter ENUM('Q1', 'Q2', 'Q3', 'Q4'),
        target_revenue DECIMAL(15, 2),
        target_expense DECIMAL(15, 2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_fin_plan_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log("Finance tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
