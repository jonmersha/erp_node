import pool from './db.js';

export const initDb = async () => {
  try {
    // Topological Order for Foreign Keys:
    // 1. Level 0: companies
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          address TEXT,
          phone VARCHAR(20),
          email VARCHAR(255),
          logo_url TEXT,
          banner_url TEXT,
          owner_id VARCHAR(255) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 2. Level 1: units, factories, sales_outlets, suppliers, raw_materials, categories, customers
    await pool.query(`
      CREATE TABLE IF NOT EXISTS units (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          location TEXT,
          company_id CHAR(36) NOT NULL,
          CONSTRAINT fk_unit_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS factories (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          location TEXT NOT NULL,
          company_id CHAR(36) NOT NULL,
          manager_id VARCHAR(255),
          CONSTRAINT fk_factory_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_factory_manager FOREIGN KEY (manager_id) REFERENCES users(uid) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_outlets (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          location TEXT NOT NULL,
          company_id CHAR(36) NOT NULL,
          factory_id CHAR(36),
          CONSTRAINT fk_outlet_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_outlet_factory FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          contact VARCHAR(255),
          email VARCHAR(255),
          company_id CHAR(36) NOT NULL,
          certificate_url VARCHAR(500),
          is_authorized BOOLEAN DEFAULT FALSE,
          status ENUM('pending_approval', 'active', 'inactive') DEFAULT 'pending_approval',
          created_by VARCHAR(36),
          approved_by VARCHAR(36),
          CONSTRAINT fk_supplier_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS raw_materials (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          unit VARCHAR(20) NOT NULL,
          company_id CHAR(36) NOT NULL,
          CONSTRAINT fk_material_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          company_id CHAR(36) NOT NULL,
          CONSTRAINT fk_category_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          email VARCHAR(255),
          address TEXT,
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_cust_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 3. Level 2: warehouses, products, employees, users, crm_tickets, customer_interactions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS warehouses (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          location TEXT NOT NULL,
          factory_id CHAR(36),
          company_id CHAR(36) NOT NULL,
          manager_id VARCHAR(255),
          CONSTRAINT fk_warehouse_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_warehouse_factory FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE,
          CONSTRAINT fk_warehouse_manager FOREIGN KEY (manager_id) REFERENCES users(uid) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category_id CHAR(36) NOT NULL,
          package_size VARCHAR(50) NOT NULL,
          unit VARCHAR(20),
          price DECIMAL(12, 2) NOT NULL,
          image_url TEXT,
          company_id CHAR(36) NOT NULL,
          CONSTRAINT fk_product_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

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
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          role VARCHAR(100),
          salary DECIMAL(12, 2),
          factory_id CHAR(36),
          hire_date DATE,
          department_id CHAR(36),
          manager_id CHAR(36),
          company_id CHAR(36) NOT NULL,
          CONSTRAINT fk_employee_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_employee_factory FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE,
          CONSTRAINT fk_employee_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
          CONSTRAINT fk_employee_manager FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);
    
    // Add manager_id FK to departments (has to be after employees is created)
    try {
      await pool.query(`
        ALTER TABLE departments 
        ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;
      `);
    } catch(e) {
      if (e.code !== 'ER_DUP_KEYNAME') console.error(e.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
          id CHAR(36) PRIMARY KEY,
          employee_id CHAR(36) NOT NULL,
          date DATE NOT NULL,
          clock_in DATETIME,
          clock_out DATETIME,
          status ENUM('present', 'absent', 'late', 'half_day') DEFAULT 'absent',
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_att_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
          CONSTRAINT fk_att_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
          id CHAR(36) PRIMARY KEY,
          employee_id CHAR(36) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          type ENUM('annual', 'sick', 'maternity', 'unpaid', 'other') NOT NULL,
          reason TEXT,
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          approved_by CHAR(36),
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_lr_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
          CONSTRAINT fk_lr_approver FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL,
          CONSTRAINT fk_lr_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
          uid VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          status ENUM('active', 'inactive') DEFAULT 'active',
          roles JSON NOT NULL,
          company_id CHAR(36) NOT NULL,
          unit_id CHAR(36),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_user_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_user_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS crm_tickets (
          id CHAR(36) PRIMARY KEY,
          customer_id CHAR(36) NOT NULL,
          type ENUM('feedback', 'complaint', 'inquiry') DEFAULT 'inquiry',
          status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
          resolution_notes TEXT,
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_ticket_cust FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
          CONSTRAINT fk_ticket_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_interactions (
          id CHAR(36) PRIMARY KEY,
          customer_id CHAR(36) NOT NULL,
          interaction_type ENUM('sales', 'support', 'delivery', 'general') DEFAULT 'general',
          notes TEXT NOT NULL,
          interaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_id CHAR(36),
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_inter_cust FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
          CONSTRAINT fk_inter_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 4. Level 3: recipes, purchase_orders, sales_orders, inventory, plans
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recipes (
          id CHAR(36) PRIMARY KEY,
          product_id CHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          bom JSON NOT NULL,
          processing_steps JSON NOT NULL,
          yield_percentage DECIMAL(5, 2),
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_recipe_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_recipe_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
          id CHAR(36) PRIMARY KEY,
          supplier_id CHAR(36) NOT NULL,
          factory_id CHAR(36),
          warehouse_id CHAR(36),
          status ENUM('pending', 'pending_approval', 'approved', 'shipped', 'received', 'cancelled') DEFAULT 'pending_approval',
          total_amount DECIMAL(12, 2) NOT NULL,
          company_id CHAR(36) NOT NULL,
          created_by VARCHAR(36),
          approved_by VARCHAR(36),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_po_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
          CONSTRAINT fk_po_factory FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE,
          CONSTRAINT fk_po_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_orders (
          id CHAR(36) PRIMARY KEY,
          customer_id CHAR(36),
          outlet_id CHAR(36),
          status ENUM('draft', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'draft',
          total_amount DECIMAL(12, 2) NOT NULL,
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_so_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_so_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
          CONSTRAINT fk_so_outlet FOREIGN KEY (outlet_id) REFERENCES sales_outlets(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
          id CHAR(36) PRIMARY KEY,
          unit_id CHAR(36) NOT NULL,
          item_id CHAR(36) NOT NULL,
          item_type ENUM('product', 'material') NOT NULL,
          quantity DECIMAL(12, 2) NOT NULL,
          batch_number VARCHAR(100),
          expiry_date DATE,
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_inv_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS procurement_plans (
          id CHAR(36) PRIMARY KEY,
          factory_id CHAR(36),
          warehouse_id CHAR(36),
          material_id CHAR(36),
          year INT NOT NULL,
          total_quantity DECIMAL(12, 2) NOT NULL,
          quarterly_plans JSON,
          status ENUM('planned', 'pending_approval', 'ordered', 'received', 'approved') DEFAULT 'pending_approval',
          company_id CHAR(36) NOT NULL,
          created_by VARCHAR(36),
          approved_by VARCHAR(36),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_procplan_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_procplan_factory FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE,
          CONSTRAINT fk_procplan_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
          CONSTRAINT fk_procplan_material FOREIGN KEY (material_id) REFERENCES raw_materials(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_plans (
          id CHAR(36) PRIMARY KEY,
          factory_id CHAR(36) NOT NULL,
          product_id CHAR(36) NOT NULL,
          year INT NOT NULL,
          total_quantity DECIMAL(12, 2) NOT NULL,
          quarterly_plans JSON,
          status ENUM('draft', 'pending_approval', 'approved') DEFAULT 'pending_approval',
          company_id CHAR(36) NOT NULL,
          created_by VARCHAR(36),
          approved_by VARCHAR(36),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_salesplan_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_salesplan_factory FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE,
          CONSTRAINT fk_salesplan_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS production_plans (
          id CHAR(36) PRIMARY KEY,
          factory_id CHAR(36) NOT NULL,
          product_id CHAR(36) NOT NULL,
          year INT NOT NULL,
          total_quantity DECIMAL(12, 2) NOT NULL,
          quarterly_plans JSON,
          status ENUM('draft', 'pending_approval', 'approved') DEFAULT 'pending_approval',
          company_id CHAR(36) NOT NULL,
          created_by VARCHAR(36),
          approved_by VARCHAR(36),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_prodplan_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_prodplan_factory FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE,
          CONSTRAINT fk_prodplan_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 5. Level 4: purchase_order_items, production_runs, grns, delivery_notes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id CHAR(36) NOT NULL,
          item_id CHAR(36) NOT NULL,
          item_name VARCHAR(255),
          quantity DECIMAL(12, 2) NOT NULL,
          price DECIMAL(12, 2) NOT NULL,
          CONSTRAINT fk_poi_order FOREIGN KEY (order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS production_runs (
          id CHAR(36) PRIMARY KEY,
          factory_id CHAR(36) NOT NULL,
          product_id CHAR(36) NOT NULL,
          recipe_id CHAR(36) NOT NULL,
          quantity_planned DECIMAL(12, 2) NOT NULL,
          quantity_produced DECIMAL(12, 2) DEFAULT 0,
          status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
          start_date DATETIME,
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_run_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_run_factory FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE,
          CONSTRAINT fk_run_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          CONSTRAINT fk_run_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS grns (
          id CHAR(36) PRIMARY KEY,
          purchase_order_id CHAR(36) NOT NULL,
          warehouse_id CHAR(36) NOT NULL,
          receipt_date DATETIME NOT NULL,
          status ENUM('received', 'inspected', 'rejected') DEFAULT 'received',
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_grn_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_grn_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
          CONSTRAINT fk_grn_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivery_notes (
          id CHAR(36) PRIMARY KEY,
          sales_order_id CHAR(36) NOT NULL,
          outlet_id CHAR(36) NOT NULL,
          dispatch_date DATETIME NOT NULL,
          status ENUM('dispatched', 'delivered', 'returned') DEFAULT 'dispatched',
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_dn_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_dn_so FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
          CONSTRAINT fk_dn_outlet FOREIGN KEY (outlet_id) REFERENCES sales_outlets(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 6. Level 5: quality_checks (references grn, production_run, inventory)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quality_checks (
          id CHAR(36) PRIMARY KEY,
          reference_id CHAR(36) NOT NULL,
          reference_type ENUM('production_run', 'grn', 'inventory') NOT NULL,
          item_id CHAR(36) NOT NULL,
          inspector_id CHAR(36) NOT NULL,
          check_date DATETIME NOT NULL,
          status ENUM('passed', 'failed', 'pending', 'quarantined') NOT NULL DEFAULT 'pending',
          notes TEXT,
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_qc_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `).catch(console.error);

    console.log('Database schema initialization completed.');

    try {
      await pool.query('ALTER TABLE sales_outlets ADD COLUMN factory_id CHAR(36) NULL;');
      await pool.query('ALTER TABLE sales_outlets ADD CONSTRAINT fk_outlet_factory FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE;');
      console.log('Added factory_id to sales_outlets.');
    } catch (e) {
      // Ignore if column already exists
    }
  } catch (err) {
    console.error('DB Init error:', err);
  }
};
