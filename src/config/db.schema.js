import pool from './db.config.js';

export const initDb = async () => {
  try {
    await pool.query('SET FOREIGN_KEY_CHECKS=0;');

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`attendance\` (
  \`id\` char(36) NOT NULL,
  \`employee_id\` char(36) NOT NULL,
  \`date\` date NOT NULL,
  \`clock_in\` datetime DEFAULT NULL,
  \`clock_out\` datetime DEFAULT NULL,
  \`status\` enum('present','absent','late','half_day') DEFAULT 'absent',
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`overtime_hours\` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (\`id\`),
  KEY \`fk_att_employee\` (\`employee_id\`),
  KEY \`fk_att_company\` (\`company_id\`),
  CONSTRAINT \`fk_att_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_att_employee\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`entity_type\` varchar(50) NOT NULL,
  \`entity_id\` varchar(100) NOT NULL,
  \`action\` varchar(50) NOT NULL,
  \`description\` text NOT NULL,
  \`performed_by\` varchar(100) NOT NULL,
  \`company_id\` varchar(100) NOT NULL,
  \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`bids\` (
  \`id\` char(36) NOT NULL,
  \`rfq_id\` char(36) NOT NULL,
  \`supplier_id\` char(36) NOT NULL,
  \`total_amount\` decimal(15,2) NOT NULL,
  \`delivery_time_days\` int DEFAULT NULL,
  \`status\` enum('submitted','under_review','accepted','rejected') DEFAULT 'submitted',
  \`notes\` text,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_bids_rfq\` (\`rfq_id\`),
  KEY \`fk_bids_supplier\` (\`supplier_id\`),
  CONSTRAINT \`fk_bids_rfq\` FOREIGN KEY (\`rfq_id\`) REFERENCES \`rfqs\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_bids_supplier\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`budgets\` (
  \`id\` char(36) NOT NULL,
  \`cost_center_id\` char(36) NOT NULL,
  \`fiscal_year\` int NOT NULL,
  \`total_amount\` decimal(15,2) NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`unique_budget_year\` (\`cost_center_id\`,\`fiscal_year\`),
  KEY \`company_id\` (\`company_id\`),
  CONSTRAINT \`budgets_ibfk_1\` FOREIGN KEY (\`cost_center_id\`) REFERENCES \`cost_centers\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`budgets_ibfk_2\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`categories\` (
  \`id\` char(36) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`description\` text,
  \`company_id\` char(36) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_category_company\` (\`company_id\`),
  CONSTRAINT \`fk_category_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`companies\` (
  \`id\` char(36) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`address\` text,
  \`phone\` varchar(20) DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`logo_url\` text,
  \`banner_url\` text,
  \`owner_id\` varchar(255) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`cost_centers\` (
  \`id\` char(36) NOT NULL,
  \`name\` varchar(100) NOT NULL,
  \`code\` varchar(50) NOT NULL,
  \`description\` text,
  \`manager_id\` char(36) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`company_id\` (\`company_id\`),
  CONSTRAINT \`cost_centers_ibfk_1\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`crm_tickets\` (
  \`id\` char(36) NOT NULL,
  \`customer_id\` char(36) NOT NULL,
  \`type\` enum('feedback','complaint','inquiry') DEFAULT 'inquiry',
  \`status\` enum('open','in_progress','resolved','closed') DEFAULT 'open',
  \`resolution_notes\` text,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_ticket_cust_sv\` (\`customer_id\`),
  KEY \`fk_ticket_company_sv\` (\`company_id\`),
  CONSTRAINT \`fk_ticket_company_sv\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_ticket_cust_sv\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`customer_interactions\` (
  \`id\` char(36) NOT NULL,
  \`customer_id\` char(36) NOT NULL,
  \`interaction_type\` enum('sales','support','delivery','general') DEFAULT 'general',
  \`notes\` text NOT NULL,
  \`interaction_date\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`user_id\` char(36) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_inter_cust_sv\` (\`customer_id\`),
  KEY \`fk_inter_company_sv\` (\`company_id\`),
  CONSTRAINT \`fk_inter_company_sv\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_inter_cust_sv\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`customers\` (
  \`id\` char(36) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`phone\` varchar(50) DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`address\` text,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_cust_company_sv\` (\`company_id\`),
  CONSTRAINT \`fk_cust_company_sv\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`delivery_notes\` (
  \`id\` char(36) NOT NULL,
  \`sales_order_id\` char(36) NOT NULL,
  \`outlet_id\` char(36) NOT NULL,
  \`dispatch_date\` datetime NOT NULL,
  \`status\` enum('dispatched','delivered','returned') DEFAULT 'dispatched',
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_dn_company\` (\`company_id\`),
  KEY \`fk_dn_so\` (\`sales_order_id\`),
  KEY \`fk_dn_outlet\` (\`outlet_id\`),
  CONSTRAINT \`fk_dn_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_dn_outlet\` FOREIGN KEY (\`outlet_id\`) REFERENCES \`sales_outlets\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_dn_so\` FOREIGN KEY (\`sales_order_id\`) REFERENCES \`sales_orders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`departments\` (
  \`id\` char(36) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`description\` text,
  \`parent_department_id\` char(36) DEFAULT NULL,
  \`manager_id\` char(36) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_dept_company\` (\`company_id\`),
  KEY \`fk_dept_parent\` (\`parent_department_id\`),
  KEY \`fk_dept_manager\` (\`manager_id\`),
  CONSTRAINT \`fk_dept_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_dept_manager\` FOREIGN KEY (\`manager_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_dept_parent\` FOREIGN KEY (\`parent_department_id\`) REFERENCES \`departments\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`employees\` (
  \`id\` char(36) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`role\` varchar(100) DEFAULT NULL,
  \`salary\` decimal(12,2) DEFAULT NULL,
  \`factory_id\` char(36) DEFAULT NULL,
  \`hire_date\` date DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`department_id\` char(36) DEFAULT NULL,
  \`manager_id\` char(36) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_employee_company\` (\`company_id\`),
  KEY \`fk_employee_factory\` (\`factory_id\`),
  KEY \`fk_emp_dept\` (\`department_id\`),
  KEY \`fk_emp_manager\` (\`manager_id\`),
  CONSTRAINT \`fk_emp_dept\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_emp_manager\` FOREIGN KEY (\`manager_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_employee_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_employee_factory\` FOREIGN KEY (\`factory_id\`) REFERENCES \`factories\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`expenses\` (
  \`id\` char(36) NOT NULL,
  \`cost_center_id\` char(36) NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`date\` datetime NOT NULL,
  \`description\` text,
  \`category\` varchar(100) NOT NULL,
  \`status\` enum('pending','approved','rejected','paid') DEFAULT 'pending',
  \`company_id\` char(36) NOT NULL,
  \`created_by\` varchar(36) NOT NULL,
  \`approved_by\` varchar(36) DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`cost_center_id\` (\`cost_center_id\`),
  KEY \`company_id\` (\`company_id\`),
  CONSTRAINT \`expenses_ibfk_1\` FOREIGN KEY (\`cost_center_id\`) REFERENCES \`cost_centers\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`expenses_ibfk_2\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`factories\` (
  \`id\` char(36) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`location\` text NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`manager_id\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_factory_company\` (\`company_id\`),
  KEY \`fk_factory_manager\` (\`manager_id\`),
  CONSTRAINT \`fk_factory_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_factory_manager\` FOREIGN KEY (\`manager_id\`) REFERENCES \`users\` (\`uid\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`finance_invoices\` (
  \`id\` char(36) NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`order_id\` varchar(100) DEFAULT NULL,
  \`order_type\` enum('purchase','sales') DEFAULT NULL,
  \`amount\` decimal(15,2) DEFAULT NULL,
  \`due_date\` date DEFAULT NULL,
  \`status\` enum('draft','issued','paid','overdue','cancelled') DEFAULT 'draft',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_fin_inv_company\` (\`company_id\`),
  CONSTRAINT \`fk_fin_inv_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`finance_payments\` (
  \`id\` char(36) NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`invoice_id\` char(36) NOT NULL,
  \`amount\` decimal(15,2) DEFAULT NULL,
  \`payment_date\` date DEFAULT NULL,
  \`payment_method\` enum('cash','bank_transfer','check','credit_card') DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_fin_pay_company\` (\`company_id\`),
  CONSTRAINT \`fk_fin_pay_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`fixed_assets\` (
  \`id\` char(36) NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`asset_name\` varchar(255) NOT NULL,
  \`asset_type\` enum('machinery','vehicle','building','furniture','electronics','other') NOT NULL,
  \`purchase_date\` date NOT NULL,
  \`purchase_cost\` decimal(15,2) NOT NULL,
  \`salvage_value\` decimal(15,2) DEFAULT '0.00',
  \`useful_life_years\` int NOT NULL,
  \`depreciation_method\` enum('straight_line','declining_balance') DEFAULT 'straight_line',
  \`status\` enum('active','sold','scrapped','maintenance') DEFAULT 'active',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_fixed_asset_company\` (\`company_id\`),
  CONSTRAINT \`fk_fixed_asset_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`financial_plans\` (
  \`id\` char(36) NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`year\` int NOT NULL,
  \`quarter\` enum('Q1','Q2','Q3','Q4') DEFAULT NULL,
  \`target_revenue\` decimal(15,2) DEFAULT NULL,
  \`target_expense\` decimal(15,2) DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_fin_plan_company\` (\`company_id\`),
  CONSTRAINT \`fk_fin_plan_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`fleet_consumptions\` (
  \`id\` char(36) NOT NULL,
  \`vehicle_id\` char(36) NOT NULL,
  \`type\` enum('fuel','maintenance','repair','toll') NOT NULL,
  \`cost\` decimal(15,2) NOT NULL,
  \`date\` datetime NOT NULL,
  \`description\` text,
  \`cost_center_id\` char(36) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`recorded_by\` varchar(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`vehicle_id\` (\`vehicle_id\`),
  KEY \`company_id\` (\`company_id\`),
  CONSTRAINT \`fleet_consumptions_ibfk_1\` FOREIGN KEY (\`vehicle_id\`) REFERENCES \`vehicles\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fleet_consumptions_ibfk_2\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`gate_passes\` (
  \`id\` char(36) NOT NULL,
  \`delivery_note_id\` char(36) NOT NULL,
  \`qr_code\` varchar(255) NOT NULL,
  \`security_verified_at\` datetime DEFAULT NULL,
  \`status\` enum('Issued','Verified','Expired','Cancelled') DEFAULT 'Issued',
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_gp_dn\` (\`delivery_note_id\`),
  KEY \`fk_gp_company\` (\`company_id\`),
  CONSTRAINT \`fk_gp_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_gp_dn\` FOREIGN KEY (\`delivery_note_id\`) REFERENCES \`delivery_notes\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`grain_intake_logs\` (
  \`id\` char(36) NOT NULL,
  \`gross_weight\` decimal(10,2) NOT NULL,
  \`tare_weight\` decimal(10,2) NOT NULL,
  \`net_weight\` decimal(10,2) GENERATED ALWAYS AS ((\`gross_weight\` - \`tare_weight\`)) STORED,
  \`supplier_id\` char(36) DEFAULT NULL,
  \`moisture_percent\` decimal(5,2) DEFAULT NULL,
  \`silo_id\` varchar(50) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_intake_supplier\` (\`supplier_id\`),
  KEY \`fk_intake_company\` (\`company_id\`),
  CONSTRAINT \`fk_intake_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_intake_supplier\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`grn_items\` (
  \`id\` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`grn_id\` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`item_id\` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`quantity\` decimal(12,2) NOT NULL,
  \`price\` decimal(12,2) NOT NULL,
  \`company_id\` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_grn_id\` (\`grn_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`grns\` (
  \`id\` char(36) NOT NULL,
  \`purchase_order_id\` char(36) NOT NULL,
  \`warehouse_id\` char(36) NOT NULL,
  \`receipt_date\` datetime NOT NULL,
  \`status\` enum('received','inspected','rejected') DEFAULT 'received',
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_grn_company\` (\`company_id\`),
  KEY \`fk_grn_po\` (\`purchase_order_id\`),
  KEY \`fk_grn_warehouse\` (\`warehouse_id\`),
  CONSTRAINT \`fk_grn_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_grn_po\` FOREIGN KEY (\`purchase_order_id\`) REFERENCES \`purchase_orders\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_grn_warehouse\` FOREIGN KEY (\`warehouse_id\`) REFERENCES \`warehouses\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`inventory\` (
  \`id\` char(36) NOT NULL,
  \`unit_id\` char(36) NOT NULL,
  \`item_id\` char(36) NOT NULL,
  \`item_type\` enum('product','material') NOT NULL,
  \`quantity\` decimal(12,2) NOT NULL,
  \`batch_number\` varchar(100) DEFAULT NULL,
  \`expiry_date\` date DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_inv_company\` (\`company_id\`),
  CONSTRAINT \`fk_inv_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`inventory_lots\` (
  \`id\` char(36) NOT NULL,
  \`item_id\` char(36) NOT NULL,
  \`lot_number\` varchar(100) NOT NULL,
  \`batch_number\` varchar(100) DEFAULT NULL,
  \`manufacture_date\` date DEFAULT NULL,
  \`expiry_date\` date DEFAULT NULL,
  \`farm_origin\` varchar(255) DEFAULT NULL,
  \`status\` enum('Available','Quarantine','Blocked') DEFAULT 'Quarantine',
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_lot_company\` (\`company_id\`),
  CONSTRAINT \`fk_lot_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`inventory_transactions\` (
  \`id\` char(36) NOT NULL,
  \`inventory_id\` char(36) NOT NULL,
  \`item_id\` char(36) NOT NULL,
  \`item_type\` enum('product','material') NOT NULL,
  \`transaction_type\` enum('in','out','transfer','adjustment') NOT NULL,
  \`quantity\` decimal(12,2) NOT NULL,
  \`reference_id\` char(36) DEFAULT NULL,
  \`reference_type\` enum('purchase_order','sales_order','production_run','grn','delivery_note','manual') NOT NULL,
  \`notes\` text,
  \`user_id\` varchar(255) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_inv_tx_company\` (\`company_id\`),
  CONSTRAINT \`fk_inv_tx_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`journal_entries\` (
  \`id\` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`date\` datetime NOT NULL,
  \`account_type\` enum('inventory','accounts_payable','accounts_receivable','cash','cogs','revenue','expense') COLLATE utf8mb4_unicode_ci NOT NULL,
  \`amount\` decimal(15,2) NOT NULL,
  \`entry_type\` enum('debit','credit') COLLATE utf8mb4_unicode_ci NOT NULL,
  \`reference_type\` enum('grn','sales_invoice','payment','manual') COLLATE utf8mb4_unicode_ci NOT NULL,
  \`reference_id\` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`description\` text COLLATE utf8mb4_unicode_ci,
  \`company_id\` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_company_date\` (\`company_id\`,\`date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`leave_requests\` (
  \`id\` char(36) NOT NULL,
  \`employee_id\` char(36) NOT NULL,
  \`start_date\` date NOT NULL,
  \`end_date\` date NOT NULL,
  \`type\` enum('annual','sick','maternity','unpaid','other') NOT NULL,
  \`reason\` text,
  \`status\` enum('pending','approved','rejected') DEFAULT 'pending',
  \`approved_by\` char(36) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_lr_employee\` (\`employee_id\`),
  KEY \`fk_lr_approver\` (\`approved_by\`),
  KEY \`fk_lr_company\` (\`company_id\`),
  CONSTRAINT \`fk_lr_approver\` FOREIGN KEY (\`approved_by\`) REFERENCES \`employees\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_lr_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_lr_employee\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`logistics_shipments\` (
  \`id\` char(36) NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`order_id\` varchar(100) DEFAULT NULL,
  \`status\` enum('pending','in_transit','delivered') DEFAULT 'pending',
  \`delivery_date\` date DEFAULT NULL,
  \`temperature_log\` json DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_logisticsshipment_company\` (\`company_id\`),
  CONSTRAINT \`fk_logisticsshipment_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`maintenance_logs\` (
  \`id\` char(36) NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`equipment_id\` varchar(100) DEFAULT NULL,
  \`date\` date DEFAULT NULL,
  \`description\` text,
  \`technician\` varchar(100) DEFAULT NULL,
  \`cost\` decimal(12,2) DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_maintenancelog_company\` (\`company_id\`),
  CONSTRAINT \`fk_maintenancelog_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`milling_logs\` (
  \`id\` char(36) NOT NULL,
  \`run_id\` char(36) NOT NULL,
  \`raw_wheat_consumed\` decimal(10,2) DEFAULT NULL,
  \`water_added\` decimal(10,2) DEFAULT NULL,
  \`extraction_rate\` decimal(5,2) DEFAULT NULL,
  \`machine_downtime_minutes\` int DEFAULT '0',
  \`maintenance_notes\` text,
  \`shift_operator_id\` char(36) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_milling_run\` (\`run_id\`),
  KEY \`fk_milling_operator\` (\`shift_operator_id\`),
  KEY \`fk_milling_company\` (\`company_id\`),
  CONSTRAINT \`fk_milling_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_milling_operator\` FOREIGN KEY (\`shift_operator_id\`) REFERENCES \`users\` (\`uid\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_milling_run\` FOREIGN KEY (\`run_id\`) REFERENCES \`production_runs\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`packaging_logs\` (
  \`id\` char(36) NOT NULL,
  \`machine_id\` varchar(50) NOT NULL,
  \`product_id\` char(36) DEFAULT NULL,
  \`bag_size_kg\` int NOT NULL,
  \`bag_count\` int NOT NULL,
  \`total_weight\` decimal(10,2) GENERATED ALWAYS AS ((\`bag_size_kg\` * \`bag_count\`)) STORED,
  \`warehouse_id\` char(36) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_packaging_product\` (\`product_id\`),
  KEY \`fk_packaging_warehouse\` (\`warehouse_id\`),
  KEY \`fk_packaging_company\` (\`company_id\`),
  CONSTRAINT \`fk_packaging_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_packaging_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_packaging_warehouse\` FOREIGN KEY (\`warehouse_id\`) REFERENCES \`warehouses\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`procurement_plans\` (
  \`id\` char(36) NOT NULL,
  \`factory_id\` char(36) DEFAULT NULL,
  \`warehouse_id\` char(36) DEFAULT NULL,
  \`material_id\` char(36) DEFAULT NULL,
  \`year\` int NOT NULL,
  \`total_quantity\` decimal(12,2) NOT NULL,
  \`quarterly_plans\` json DEFAULT NULL,
  \`status\` enum('pending_approval','planned','ordered','received','approved') DEFAULT 'pending_approval',
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`created_by\` varchar(36) DEFAULT NULL,
  \`approved_by\` varchar(36) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_procplan_company\` (\`company_id\`),
  KEY \`fk_procplan_factory\` (\`factory_id\`),
  KEY \`fk_procplan_warehouse\` (\`warehouse_id\`),
  KEY \`fk_procplan_material\` (\`material_id\`),
  CONSTRAINT \`fk_procplan_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_procplan_factory\` FOREIGN KEY (\`factory_id\`) REFERENCES \`factories\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_procplan_material\` FOREIGN KEY (\`material_id\`) REFERENCES \`raw_materials\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_procplan_warehouse\` FOREIGN KEY (\`warehouse_id\`) REFERENCES \`warehouses\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`production_events\` (
  \`id\` char(36) NOT NULL,
  \`run_id\` char(36) NOT NULL,
  \`event_type\` varchar(100) NOT NULL,
  \`payload\` json DEFAULT NULL,
  \`notes\` text,
  \`performed_by\` char(36) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_event_run\` (\`run_id\`),
  KEY \`fk_event_company\` (\`company_id\`),
  CONSTRAINT \`fk_event_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_event_run\` FOREIGN KEY (\`run_id\`) REFERENCES \`production_runs\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`production_plans\` (
  \`id\` char(36) NOT NULL,
  \`factory_id\` char(36) NOT NULL,
  \`product_id\` char(36) NOT NULL,
  \`year\` int NOT NULL,
  \`total_quantity\` decimal(12,2) NOT NULL,
  \`quarterly_plans\` json DEFAULT NULL,
  \`status\` enum('draft','approved') DEFAULT 'draft',
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`created_by\` varchar(36) DEFAULT NULL,
  \`approved_by\` varchar(36) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_prodplan_company\` (\`company_id\`),
  KEY \`fk_prodplan_factory\` (\`factory_id\`),
  KEY \`fk_prodplan_product\` (\`product_id\`),
  CONSTRAINT \`fk_prodplan_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_prodplan_factory\` FOREIGN KEY (\`factory_id\`) REFERENCES \`factories\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_prodplan_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`production_run_stages\` (
  \`id\` char(36) NOT NULL,
  \`run_id\` char(36) NOT NULL,
  \`stage_name\` varchar(100) NOT NULL,
  \`stage_order\` int NOT NULL,
  \`estimated_time_minutes\` int DEFAULT NULL,
  \`percentage_weight\` decimal(5,2) DEFAULT NULL,
  \`assigned_operator_id\` varchar(255) DEFAULT NULL,
  \`status\` enum('pending','in_progress','completed') DEFAULT 'pending',
  \`actual_time_minutes\` int DEFAULT NULL,
  \`notes\` text,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`quantity_produced\` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_stage_run\` (\`run_id\`),
  KEY \`fk_stage_operator\` (\`assigned_operator_id\`),
  CONSTRAINT \`fk_stage_operator\` FOREIGN KEY (\`assigned_operator_id\`) REFERENCES \`users\` (\`uid\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_stage_run\` FOREIGN KEY (\`run_id\`) REFERENCES \`production_runs\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`production_runs\` (
  \`id\` char(36) NOT NULL,
  \`factory_id\` char(36) NOT NULL,
  \`product_id\` char(36) NOT NULL,
  \`recipe_id\` char(36) DEFAULT NULL,
  \`quantity_planned\` decimal(12,2) NOT NULL,
  \`quantity_produced\` decimal(12,2) DEFAULT '0.00',
  \`status\` enum('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
  \`start_date\` datetime DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`workflow_template_id\` char(36) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_run_company\` (\`company_id\`),
  KEY \`fk_run_factory\` (\`factory_id\`),
  KEY \`fk_run_product\` (\`product_id\`),
  KEY \`fk_run_recipe\` (\`recipe_id\`),
  CONSTRAINT \`fk_run_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_run_factory\` FOREIGN KEY (\`factory_id\`) REFERENCES \`factories\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_run_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_run_recipe\` FOREIGN KEY (\`recipe_id\`) REFERENCES \`recipes\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` char(36) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`category_id\` char(36) DEFAULT NULL,
  \`package_size\` varchar(50) NOT NULL,
  \`unit\` varchar(20) DEFAULT NULL,
  \`price\` decimal(12,2) NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`image_url\` text,
  PRIMARY KEY (\`id\`),
  KEY \`fk_product_company\` (\`company_id\`),
  KEY \`fk_product_category\` (\`category_id\`),
  CONSTRAINT \`fk_product_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_product_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`purchase_order_items\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`order_id\` char(36) NOT NULL,
  \`item_id\` char(36) NOT NULL,
  \`item_name\` varchar(255) DEFAULT NULL,
  \`quantity\` decimal(12,2) NOT NULL,
  \`price\` decimal(12,2) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_poi_order\` (\`order_id\`),
  CONSTRAINT \`fk_poi_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`purchase_orders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`purchase_orders\` (
  \`id\` char(36) NOT NULL,
  \`supplier_id\` char(36) NOT NULL,
  \`factory_id\` char(36) DEFAULT NULL,
  \`warehouse_id\` char(36) DEFAULT NULL,
  \`status\` enum('pending','approved','shipped','received','cancelled') DEFAULT 'pending',
  \`total_amount\` decimal(12,2) NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`created_by\` varchar(36) DEFAULT NULL,
  \`approved_by\` varchar(36) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_po_company\` (\`company_id\`),
  KEY \`fk_po_supplier\` (\`supplier_id\`),
  KEY \`fk_po_factory\` (\`factory_id\`),
  KEY \`fk_po_warehouse\` (\`warehouse_id\`),
  CONSTRAINT \`fk_po_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_po_factory\` FOREIGN KEY (\`factory_id\`) REFERENCES \`factories\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_po_supplier\` FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_po_warehouse\` FOREIGN KEY (\`warehouse_id\`) REFERENCES \`warehouses\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`purchase_requisitions\` (
  \`id\` char(36) NOT NULL,
  \`department_id\` char(36) NOT NULL,
  \`item_id\` char(36) NOT NULL,
  \`item_name\` varchar(255) NOT NULL,
  \`quantity\` decimal(12,2) NOT NULL,
  \`required_date\` date NOT NULL,
  \`status\` enum('draft','pending_approval','approved','rejected','converted_to_po') DEFAULT 'pending_approval',
  \`budget_code\` varchar(100) DEFAULT NULL,
  \`notes\` text,
  \`created_by\` varchar(36) DEFAULT NULL,
  \`approved_by\` varchar(36) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_pr_dept\` (\`department_id\`),
  KEY \`fk_pr_company\` (\`company_id\`),
  CONSTRAINT \`fk_pr_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_pr_dept\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`quality_checks\` (
  \`id\` char(36) NOT NULL,
  \`reference_id\` char(36) NOT NULL,
  \`reference_type\` enum('production_run','grn','inventory') NOT NULL,
  \`item_id\` char(36) NOT NULL,
  \`inspector_id\` char(36) NOT NULL,
  \`check_date\` datetime NOT NULL,
  \`status\` enum('passed','failed','pending','quarantined') NOT NULL DEFAULT 'pending',
  \`notes\` text,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_qc_company\` (\`company_id\`),
  CONSTRAINT \`fk_qc_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`quality_inspections\` (
  \`id\` char(36) NOT NULL,
  \`weighbridge_log_id\` char(36) NOT NULL,
  \`moisture\` decimal(5,2) DEFAULT NULL,
  \`protein\` decimal(5,2) DEFAULT NULL,
  \`ash\` decimal(5,2) DEFAULT NULL,
  \`gluten\` decimal(5,2) DEFAULT NULL,
  \`status\` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  \`inspector_id\` char(36) DEFAULT NULL,
  \`notes\` text,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_qi_wb\` (\`weighbridge_log_id\`),
  KEY \`fk_qi_inspector\` (\`inspector_id\`),
  KEY \`fk_qi_company\` (\`company_id\`),
  CONSTRAINT \`fk_qi_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_qi_inspector\` FOREIGN KEY (\`inspector_id\`) REFERENCES \`users\` (\`uid\`) ON DELETE SET NULL,
  CONSTRAINT \`fk_qi_wb\` FOREIGN KEY (\`weighbridge_log_id\`) REFERENCES \`weighbridge_logs\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`raw_materials\` (
  \`id\` char(36) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`unit\` varchar(20) NOT NULL,
  \`company_id\` char(36) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_material_company\` (\`company_id\`),
  CONSTRAINT \`fk_material_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`recipes\` (
  \`id\` char(36) NOT NULL,
  \`product_id\` char(36) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`bom\` json NOT NULL,
  \`processing_steps\` json NOT NULL,
  \`yield_percentage\` decimal(5,2) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_recipe_company\` (\`company_id\`),
  KEY \`fk_recipe_product\` (\`product_id\`),
  CONSTRAINT \`fk_recipe_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_recipe_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`rfq_items\` (
  \`id\` char(36) NOT NULL,
  \`rfq_id\` char(36) NOT NULL,
  \`raw_material_id\` char(36) NOT NULL,
  \`quantity\` decimal(12,2) NOT NULL,
  \`company_id\` char(36) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_rfq_items_rfq\` (\`rfq_id\`),
  KEY \`fk_rfq_items_material\` (\`raw_material_id\`),
  CONSTRAINT \`fk_rfq_items_material\` FOREIGN KEY (\`raw_material_id\`) REFERENCES \`raw_materials\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_rfq_items_rfq\` FOREIGN KEY (\`rfq_id\`) REFERENCES \`rfqs\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`rfqs\` (
  \`id\` char(36) NOT NULL,
  \`title\` varchar(255) NOT NULL,
  \`description\` text,
  \`status\` enum('draft','published','closed','awarded') DEFAULT 'draft',
  \`deadline\` datetime DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_by\` varchar(36) DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_rfq_company\` (\`company_id\`),
  CONSTRAINT \`fk_rfq_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`roles\` (
  \`id\` char(36) NOT NULL,
  \`name\` varchar(100) NOT NULL,
  \`description\` text,
  \`permissions\` json DEFAULT NULL,
  \`is_system\` tinyint(1) DEFAULT '0',
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_role_name_company\` (\`name\`,\`company_id\`),
  KEY \`fk_role_company\` (\`company_id\`),
  CONSTRAINT \`fk_role_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`sales_order_items\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`order_id\` char(36) NOT NULL,
  \`product_id\` char(36) NOT NULL,
  \`product_name\` varchar(255) DEFAULT NULL,
  \`quantity\` decimal(12,2) NOT NULL,
  \`price\` decimal(12,2) NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`sales_orders\` (
  \`id\` char(36) NOT NULL,
  \`customer_id\` char(36) DEFAULT NULL,
  \`outlet_id\` char(36) DEFAULT NULL,
  \`status\` enum('draft','confirmed','shipped','delivered','cancelled') DEFAULT 'draft',
  \`total_amount\` decimal(12,2) NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_so_company\` (\`company_id\`),
  KEY \`fk_so_customer\` (\`customer_id\`),
  KEY \`fk_so_outlet\` (\`outlet_id\`),
  CONSTRAINT \`fk_so_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_so_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_so_outlet\` FOREIGN KEY (\`outlet_id\`) REFERENCES \`sales_outlets\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`dynamic_pricing_rules\` (
  \`id\` char(36) NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`rule_name\` varchar(255) NOT NULL,
  \`product_id\` char(36) DEFAULT NULL,
  \`condition_type\` enum('quantity_above','customer_tier','season') NOT NULL,
  \`condition_value\` varchar(100) NOT NULL,
  \`adjustment_type\` enum('percentage','fixed_amount') NOT NULL,
  \`adjustment_value\` decimal(12,2) NOT NULL,
  \`active\` tinyint(1) DEFAULT '1',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_dpr_company\` (\`company_id\`),
  KEY \`fk_dpr_product\` (\`product_id\`),
  CONSTRAINT \`fk_dpr_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_dpr_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`sales_outlets\` (
  \`id\` char(36) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`location\` text NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`factory_id\` char(36) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_outlet_company\` (\`company_id\`),
  KEY \`fk_outlet_factory\` (\`factory_id\`),
  CONSTRAINT \`fk_outlet_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_outlet_factory\` FOREIGN KEY (\`factory_id\`) REFERENCES \`factories\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`sales_plans\` (
  \`id\` char(36) NOT NULL,
  \`factory_id\` char(36) NOT NULL,
  \`product_id\` char(36) NOT NULL,
  \`year\` int NOT NULL,
  \`total_quantity\` decimal(12,2) NOT NULL,
  \`quarterly_plans\` json DEFAULT NULL,
  \`status\` enum('draft','approved') DEFAULT 'draft',
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`created_by\` varchar(36) DEFAULT NULL,
  \`approved_by\` varchar(36) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_salesplan_company\` (\`company_id\`),
  KEY \`fk_salesplan_factory\` (\`factory_id\`),
  KEY \`fk_salesplan_product\` (\`product_id\`),
  CONSTRAINT \`fk_salesplan_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_salesplan_factory\` FOREIGN KEY (\`factory_id\`) REFERENCES \`factories\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_salesplan_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`suppliers\` (
  \`id\` char(36) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`contact\` varchar(255) DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`certificate_url\` varchar(500) DEFAULT NULL,
  \`is_authorized\` tinyint(1) DEFAULT '0',
  \`status\` enum('active','inactive') DEFAULT 'inactive',
  \`created_by\` varchar(36) DEFAULT NULL,
  \`approved_by\` varchar(36) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_supplier_company\` (\`company_id\`),
  CONSTRAINT \`fk_supplier_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`units\` (
  \`id\` char(36) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`location\` text,
  \`company_id\` char(36) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_unit_company\` (\`company_id\`),
  CONSTRAINT \`fk_unit_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`users\` (
  \`uid\` varchar(255) NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`roles\` json NOT NULL,
  \`company_id\` char(36) NOT NULL,
  \`unit_id\` char(36) DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`status\` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (\`uid\`),
  KEY \`fk_user_company\` (\`company_id\`),
  KEY \`fk_user_unit\` (\`unit_id\`),
  CONSTRAINT \`fk_user_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_user_unit\` FOREIGN KEY (\`unit_id\`) REFERENCES \`units\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`vehicle_requests\` (
  \`id\` char(36) NOT NULL,
  \`employee_id\` char(36) NOT NULL,
  \`travelers\` json DEFAULT NULL,
  \`vehicle_id\` char(36) DEFAULT NULL,
  \`start_date\` datetime NOT NULL,
  \`end_date\` datetime NOT NULL,
  \`purpose\` text NOT NULL,
  \`cost_center_id\` char(36) DEFAULT NULL,
  \`status\` enum('pending_approval','approved','rejected','completed') DEFAULT 'pending_approval',
  \`company_id\` char(36) NOT NULL,
  \`created_by\` varchar(36) NOT NULL,
  \`approved_by\` varchar(36) DEFAULT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`company_id\` (\`company_id\`),
  CONSTRAINT \`vehicle_requests_ibfk_1\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`vehicles\` (
  \`id\` char(36) NOT NULL,
  \`plate_number\` varchar(50) NOT NULL,
  \`make\` varchar(50) NOT NULL,
  \`model\` varchar(50) NOT NULL,
  \`type\` enum('car','truck','van','motorcycle') NOT NULL,
  \`status\` enum('active','maintenance','out_of_service') DEFAULT 'active',
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`company_id\` (\`company_id\`),
  CONSTRAINT \`vehicles_ibfk_1\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`warehouse_locations\` (
  \`id\` char(36) NOT NULL,
  \`warehouse_id\` char(36) NOT NULL,
  \`zone\` varchar(50) DEFAULT NULL,
  \`aisle\` varchar(50) DEFAULT NULL,
  \`rack\` varchar(50) DEFAULT NULL,
  \`shelf\` varchar(50) DEFAULT NULL,
  \`bin\` varchar(50) DEFAULT NULL,
  \`barcode\` varchar(100) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_loc_warehouse\` (\`warehouse_id\`),
  KEY \`fk_loc_company\` (\`company_id\`),
  CONSTRAINT \`fk_loc_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_loc_warehouse\` FOREIGN KEY (\`warehouse_id\`) REFERENCES \`warehouses\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`warehouses\` (
  \`id\` char(36) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`location\` text NOT NULL,
  \`factory_id\` char(36) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`manager_id\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_warehouse_company\` (\`company_id\`),
  KEY \`fk_warehouse_factory\` (\`factory_id\`),
  KEY \`fk_warehouse_manager\` (\`manager_id\`),
  CONSTRAINT \`fk_warehouse_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_warehouse_factory\` FOREIGN KEY (\`factory_id\`) REFERENCES \`factories\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_warehouse_manager\` FOREIGN KEY (\`manager_id\`) REFERENCES \`users\` (\`uid\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`weighbridge_logs\` (
  \`id\` char(36) NOT NULL,
  \`reference_type\` enum('PO','SO','Transfer','Other') NOT NULL,
  \`reference_id\` char(36) DEFAULT NULL,
  \`truck_plate\` varchar(50) NOT NULL,
  \`driver_name\` varchar(100) DEFAULT NULL,
  \`gross_weight\` decimal(10,2) DEFAULT NULL,
  \`tare_weight\` decimal(10,2) DEFAULT NULL,
  \`net_weight\` decimal(10,2) DEFAULT NULL,
  \`entry_time\` datetime NOT NULL,
  \`exit_time\` datetime DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_wb_company\` (\`company_id\`),
  CONSTRAINT \`fk_wb_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`workflow_template_stages\` (
  \`id\` char(36) NOT NULL,
  \`template_id\` char(36) NOT NULL,
  \`stage_name\` varchar(100) NOT NULL,
  \`stage_order\` int NOT NULL,
  \`estimated_time_minutes\` int DEFAULT NULL,
  \`percentage_weight\` decimal(5,2) DEFAULT NULL,
  \`company_id\` char(36) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`fk_template\` (\`template_id\`),
  CONSTRAINT \`fk_template\` FOREIGN KEY (\`template_id\`) REFERENCES \`workflow_templates\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query(`
CREATE TABLE IF NOT EXISTS \`workflow_templates\` (
  \`id\` char(36) NOT NULL,
  \`name\` varchar(100) NOT NULL,
  \`description\` text,
  \`company_id\` char(36) NOT NULL,
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    await pool.query('SET FOREIGN_KEY_CHECKS=1;');
    console.log('Database schema initialization completed.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};
