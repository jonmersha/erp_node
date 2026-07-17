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
          category VARCHAR(100),
          risk_rating INT DEFAULT 3,
          payment_terms VARCHAR(100),
          bank_account VARCHAR(255),
          tax_id VARCHAR(100),
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
      if (e.code !== 'ER_DUP_KEYNAME' && !e.message.includes('Duplicate foreign key')) console.error(e.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
          id CHAR(36) PRIMARY KEY,
          employee_id CHAR(36) NOT NULL,
          date DATE NOT NULL,
          clock_in DATETIME,
          clock_out DATETIME,
          status ENUM('present', 'absent', 'late', 'half_day') DEFAULT 'absent',
          overtime_hours DECIMAL(5,2) DEFAULT 0,
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_att_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
          CONSTRAINT fk_att_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    try {
      await pool.query(`ALTER TABLE attendance ADD COLUMN overtime_hours DECIMAL(5,2) DEFAULT 0;`);
    } catch(e) {
      if (e.code !== 'ER_DUP_FIELDNAME' && !e.message.includes('Duplicate column')) console.error(e.message);
    }

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
          recipe_id CHAR(36) NULL,
          quantity_planned DECIMAL(12, 2) NOT NULL,
          quantity_produced DECIMAL(12, 2) DEFAULT 0,
          status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
          start_date DATETIME,
          workflow_template_id CHAR(36) NULL,
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_run_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
          CONSTRAINT fk_run_factory FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE,
          CONSTRAINT fk_run_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          CONSTRAINT fk_run_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS workflow_templates (
          id CHAR(36) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS workflow_template_stages (
          id CHAR(36) PRIMARY KEY,
          template_id CHAR(36) NOT NULL,
          stage_name VARCHAR(100) NOT NULL,
          stage_order INT NOT NULL,
          estimated_time_minutes INT,
          percentage_weight DECIMAL(5,2),
          company_id CHAR(36) NOT NULL,
          CONSTRAINT fk_template FOREIGN KEY (template_id) REFERENCES workflow_templates(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS production_run_stages (
          id CHAR(36) PRIMARY KEY,
          run_id CHAR(36) NOT NULL,
          stage_name VARCHAR(100) NOT NULL,
          stage_order INT NOT NULL,
          estimated_time_minutes INT,
          percentage_weight DECIMAL(5,2),
          assigned_operator_id VARCHAR(255),
          status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
          actual_time_minutes INT,
          quantity_produced DECIMAL(10,2),
          notes TEXT,
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_stage_run FOREIGN KEY (run_id) REFERENCES production_runs(id) ON DELETE CASCADE,
          CONSTRAINT fk_stage_operator FOREIGN KEY (assigned_operator_id) REFERENCES users(uid) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`maintenance_logs\` (
  \`id\` char(36) PRIMARY KEY,
  \`factory_id\` char(36),
  \`machine_id\` varchar(50) NOT NULL,
  \`type\` enum('preventive', 'corrective', 'breakdown') NOT NULL,
  \`description\` text NOT NULL,
  \`cost\` decimal(10,2) DEFAULT 0,
  \`date\` datetime NOT NULL,
  \`performed_by\` varchar(100),
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`factory_id\`) REFERENCES \`factories\`(\`id\`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS \`cost_centers\` (
  \`id\` char(36) PRIMARY KEY,
  \`name\` varchar(100) NOT NULL,
  \`code\` varchar(50) NOT NULL,
  \`description\` text,
  \`manager_id\` char(36),
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS \`budgets\` (
  \`id\` char(36) PRIMARY KEY,
  \`cost_center_id\` char(36) NOT NULL,
  \`fiscal_year\` int NOT NULL,
  \`total_amount\` decimal(15,2) NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`cost_center_id\`) REFERENCES \`cost_centers\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE CASCADE,
  UNIQUE KEY \`unique_budget_year\` (\`cost_center_id\`, \`fiscal_year\`)
);

CREATE TABLE IF NOT EXISTS \`expenses\` (
  \`id\` char(36) PRIMARY KEY,
  \`cost_center_id\` char(36) NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`date\` datetime NOT NULL,
  \`description\` text,
  \`category\` varchar(100) NOT NULL,
  \`status\` enum('pending', 'approved', 'rejected', 'paid') DEFAULT 'pending',
  \`company_id\` char(36) NOT NULL,
  \`created_by\` varchar(36) NOT NULL,
  \`approved_by\` varchar(36),
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`cost_center_id\`) REFERENCES \`cost_centers\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS \`vehicles\` (
  \`id\` char(36) PRIMARY KEY,
  \`plate_number\` varchar(50) NOT NULL,
  \`make\` varchar(50) NOT NULL,
  \`model\` varchar(50) NOT NULL,
  \`type\` enum('car', 'truck', 'van', 'motorcycle') NOT NULL,
  \`status\` enum('active', 'maintenance', 'out_of_service') DEFAULT 'active',
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS \`vehicle_requests\` (
  \`id\` char(36) PRIMARY KEY,
  \`employee_id\` char(36) NOT NULL,
  \`travelers\` JSON,
  \`vehicle_id\` char(36),
  \`start_date\` datetime NOT NULL,
  \`end_date\` datetime NOT NULL,
  \`purpose\` text NOT NULL,
  \`cost_center_id\` char(36),
  \`status\` enum('pending_approval', 'approved', 'rejected', 'completed') DEFAULT 'pending_approval',
  \`company_id\` char(36) NOT NULL,
  \`created_by\` varchar(36) NOT NULL,
  \`approved_by\` varchar(36),
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS \`fleet_consumptions\` (
  \`id\` char(36) PRIMARY KEY,
  \`vehicle_id\` char(36) NOT NULL,
  \`type\` enum('fuel', 'maintenance', 'repair', 'toll') NOT NULL,
  \`cost\` decimal(15,2) NOT NULL,
  \`date\` datetime NOT NULL,
  \`description\` text,
  \`cost_center_id\` char(36),
  \`company_id\` char(36) NOT NULL,
  \`recorded_by\` varchar(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`vehicle_id\`) REFERENCES \`vehicles\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE CASCADE
);

`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS production_events (
          id CHAR(36) PRIMARY KEY,
          run_id CHAR(36) NOT NULL,
          event_type VARCHAR(100) NOT NULL,
          payload JSON,
          notes TEXT,
          performed_by CHAR(36),
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_event_run FOREIGN KEY (run_id) REFERENCES production_runs(id) ON DELETE CASCADE,
          CONSTRAINT fk_event_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Dedicated tables for automated/tablet data capture (Phase 2 Additions)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grain_intake_logs (
          id CHAR(36) PRIMARY KEY,
          gross_weight DECIMAL(10,2) NOT NULL,
          tare_weight DECIMAL(10,2) NOT NULL,
          net_weight DECIMAL(10,2) GENERATED ALWAYS AS (gross_weight - tare_weight) STORED,
          supplier_id CHAR(36),
          moisture_percent DECIMAL(5,2),
          silo_id VARCHAR(50),
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_intake_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
          CONSTRAINT fk_intake_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS milling_logs (
          id CHAR(36) PRIMARY KEY,
          run_id CHAR(36) NOT NULL,
          raw_wheat_consumed DECIMAL(10,2),
          water_added DECIMAL(10,2),
          extraction_rate DECIMAL(5,2),
          machine_downtime_minutes INT DEFAULT 0,
          maintenance_notes TEXT,
          shift_operator_id CHAR(36),
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_milling_run FOREIGN KEY (run_id) REFERENCES production_runs(id) ON DELETE CASCADE,
          CONSTRAINT fk_milling_operator FOREIGN KEY (shift_operator_id) REFERENCES users(uid) ON DELETE SET NULL,
          CONSTRAINT fk_milling_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS packaging_logs (
          id CHAR(36) PRIMARY KEY,
          machine_id VARCHAR(50) NOT NULL,
          product_id CHAR(36),
          bag_size_kg INT NOT NULL,
          bag_count INT NOT NULL,
          total_weight DECIMAL(10,2) GENERATED ALWAYS AS (bag_size_kg * bag_count) STORED,
          warehouse_id CHAR(36),
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_packaging_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
          CONSTRAINT fk_packaging_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
          CONSTRAINT fk_packaging_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
          id CHAR(36) PRIMARY KEY,
          inventory_id CHAR(36) NOT NULL,
          item_id CHAR(36) NOT NULL,
          item_type ENUM('product', 'material') NOT NULL,
          transaction_type ENUM('in', 'out', 'transfer', 'adjustment') NOT NULL,
          quantity DECIMAL(12, 2) NOT NULL,
          reference_id CHAR(36),
          reference_type ENUM('purchase_order', 'sales_order', 'production_run', 'grn', 'delivery_note', 'manual') NOT NULL,
          notes TEXT,
          user_id VARCHAR(255),
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_inv_tx_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `).catch(console.error);
    // 7. SCM Phase 2 & Enterprise Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_requisitions (
          id CHAR(36) PRIMARY KEY,
          department_id CHAR(36) NOT NULL,
          item_id CHAR(36) NOT NULL,
          item_name VARCHAR(255) NOT NULL,
          quantity DECIMAL(12, 2) NOT NULL,
          required_date DATE NOT NULL,
          status ENUM('draft', 'pending_approval', 'approved', 'rejected', 'converted_to_po') DEFAULT 'pending_approval',
          budget_code VARCHAR(100),
          notes TEXT,
          created_by VARCHAR(36),
          approved_by VARCHAR(36),
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_pr_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
          CONSTRAINT fk_pr_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `).catch(console.error);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS warehouse_locations (
          id CHAR(36) PRIMARY KEY,
          warehouse_id CHAR(36) NOT NULL,
          zone VARCHAR(50),
          aisle VARCHAR(50),
          rack VARCHAR(50),
          shelf VARCHAR(50),
          bin VARCHAR(50),
          barcode VARCHAR(100),
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_loc_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
          CONSTRAINT fk_loc_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `).catch(console.error);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_lots (
          id CHAR(36) PRIMARY KEY,
          item_id CHAR(36) NOT NULL,
          lot_number VARCHAR(100) NOT NULL,
          batch_number VARCHAR(100),
          manufacture_date DATE,
          expiry_date DATE,
          farm_origin VARCHAR(255),
          status ENUM('Available', 'Quarantine', 'Blocked') DEFAULT 'Quarantine',
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_lot_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `).catch(console.error);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS weighbridge_logs (
          id CHAR(36) PRIMARY KEY,
          reference_type ENUM('PO', 'SO', 'Transfer', 'Other') NOT NULL,
          reference_id CHAR(36),
          truck_plate VARCHAR(50) NOT NULL,
          driver_name VARCHAR(100),
          gross_weight DECIMAL(10,2),
          tare_weight DECIMAL(10,2),
          net_weight DECIMAL(10,2),
          entry_time DATETIME NOT NULL,
          exit_time DATETIME,
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_wb_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `).catch(console.error);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quality_inspections (
          id CHAR(36) PRIMARY KEY,
          weighbridge_log_id CHAR(36) NOT NULL,
          moisture DECIMAL(5,2),
          protein DECIMAL(5,2),
          ash DECIMAL(5,2),
          gluten DECIMAL(5,2),
          status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
          inspector_id CHAR(36),
          notes TEXT,
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_qi_wb FOREIGN KEY (weighbridge_log_id) REFERENCES weighbridge_logs(id) ON DELETE CASCADE,
          CONSTRAINT fk_qi_inspector FOREIGN KEY (inspector_id) REFERENCES users(uid) ON DELETE SET NULL,
          CONSTRAINT fk_qi_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `).catch(console.error);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS gate_passes (
          id CHAR(36) PRIMARY KEY,
          delivery_note_id CHAR(36) NOT NULL,
          qr_code VARCHAR(255) NOT NULL,
          security_verified_at DATETIME,
          status ENUM('Issued', 'Verified', 'Expired', 'Cancelled') DEFAULT 'Issued',
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_gp_dn FOREIGN KEY (delivery_note_id) REFERENCES delivery_notes(id) ON DELETE CASCADE,
          CONSTRAINT fk_gp_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `).catch(console.error);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rfqs (
          id CHAR(36) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          status ENUM('draft', 'published', 'closed', 'awarded') DEFAULT 'draft',
          deadline DATETIME,
          company_id CHAR(36) NOT NULL,
          created_by VARCHAR(36),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_rfq_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `).catch(console.error);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rfq_items (
          id CHAR(36) PRIMARY KEY,
          rfq_id CHAR(36) NOT NULL,
          raw_material_id CHAR(36) NOT NULL,
          quantity DECIMAL(12, 2) NOT NULL,
          company_id CHAR(36) NOT NULL,
          CONSTRAINT fk_rfq_items_rfq FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
          CONSTRAINT fk_rfq_items_material FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `).catch(console.error);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bids (
          id CHAR(36) PRIMARY KEY,
          rfq_id CHAR(36) NOT NULL,
          supplier_id CHAR(36) NOT NULL,
          total_amount DECIMAL(15, 2) NOT NULL,
          delivery_time_days INT,
          status ENUM('submitted', 'under_review', 'accepted', 'rejected') DEFAULT 'submitted',
          notes TEXT,
          company_id CHAR(36) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_bids_rfq FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
          CONSTRAINT fk_bids_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
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
