import db from './src/db.js';

async function migrate() {
  try {
    console.log('Creating grn_items table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS grn_items (
        id CHAR(36) PRIMARY KEY,
        grn_id CHAR(36) NOT NULL,
        item_id CHAR(36) NOT NULL,
        quantity DECIMAL(12,2) NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        company_id CHAR(36) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_grn_id (grn_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Creating journal_entries table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id CHAR(36) PRIMARY KEY,
        date DATETIME NOT NULL,
        account_type ENUM('inventory', 'accounts_payable', 'accounts_receivable', 'cash', 'cogs', 'revenue', 'expense') NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        entry_type ENUM('debit', 'credit') NOT NULL,
        reference_type ENUM('grn', 'sales_invoice', 'payment', 'manual') NOT NULL,
        reference_id CHAR(36) NOT NULL,
        description TEXT,
        company_id CHAR(36) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_company_date (company_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Migration successful.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
