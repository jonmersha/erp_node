-- MySQL Database Schema for Company Structure and ERP
-- Generated from JSON Entity Definition

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS company_erp_db;
USE company_erp_db;

-- 2. Core Organization
CREATE TABLE companies (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    banner_url TEXT,
    owner_id VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Units (Tree View Source)
CREATE TABLE factories (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    company_id CHAR(36) NOT NULL,
    CONSTRAINT fk_factory_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE warehouses (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    factory_id CHAR(36),
    company_id CHAR(36) NOT NULL,
    CONSTRAINT fk_warehouse_factory FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE SET NULL,
    CONSTRAINT fk_warehouse_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE sales_outlets (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    company_id CHAR(36) NOT NULL,
    CONSTRAINT fk_outlet_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Access Management
CREATE TABLE users (
    uid VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    roles JSON NOT NULL, -- MySQL JSON type for roles array
    unit_id CHAR(36), -- Refers to factory, warehouse, or outlet ID
    company_id CHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Inventory & Items
CREATE TABLE suppliers (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    company_id CHAR(36) NOT NULL,
    CONSTRAINT fk_supplier_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE raw_materials (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit ENUM('kg', 'liter', 'unit', 'bag') NOT NULL,
    company_id CHAR(36) NOT NULL,
    CONSTRAINT fk_raw_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE products (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    package_size VARCHAR(50) NOT NULL,
    unit VARCHAR(20),
    price DECIMAL(12, 2) NOT NULL,
    company_id CHAR(36) NOT NULL,
    CONSTRAINT fk_product_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE inventory (
    id CHAR(36) PRIMARY KEY,
    unit_id CHAR(36) NOT NULL, -- ID of Unit (Factory/Warehouse/Outlet)
    item_id CHAR(36) NOT NULL, -- ID of raw_material or product
    item_type ENUM('raw', 'product') NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    batch_number VARCHAR(100),
    expiry_date DATETIME,
    company_id CHAR(36) NOT NULL,
    CONSTRAINT fk_inventory_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Production Planning
CREATE TABLE production_plans (
    id CHAR(36) PRIMARY KEY,
    factory_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    year INT NOT NULL,
    total_quantity DECIMAL(12, 2) NOT NULL,
    status ENUM('planned', 'in_progress', 'completed') DEFAULT 'planned',
    company_id CHAR(36) NOT NULL,
    CONSTRAINT fk_pplan_factory FOREIGN KEY (factory_id) REFERENCES factories(id),
    CONSTRAINT fk_pplan_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_pplan_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE production_plan_details (
    id CHAR(36) PRIMARY KEY,
    plan_id CHAR(36) NOT NULL,
    quarter ENUM('Q1', 'Q2', 'Q3', 'Q4') NOT NULL,
    month TINYINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    quantity DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_pdetail_plan FOREIGN KEY (plan_id) REFERENCES production_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE production_runs (
    id CHAR(36) PRIMARY KEY,
    factory_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    recipe_id VARCHAR(255),
    quantity_planned DECIMAL(12, 2) NOT NULL,
    quantity_produced DECIMAL(12, 2) DEFAULT 0,
    status ENUM('planned', 'in_progress', 'completed') NOT NULL,
    start_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    company_id CHAR(36) NOT NULL,
    CONSTRAINT fk_prun_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quality_checks (
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

-- 7. Orders & Finance
CREATE TABLE purchase_orders (
    id CHAR(36) PRIMARY KEY,
    supplier_id CHAR(36) NOT NULL,
    factory_id CHAR(36) NOT NULL,
    status ENUM('pending', 'approved', 'shipped', 'received', 'cancelled') NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    company_id CHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_po_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE sales_orders (
    id CHAR(36) PRIMARY KEY,
    customer_id VARCHAR(255),
    outlet_id CHAR(36) NOT NULL,
    status ENUM('pending', 'paid', 'ready_to_ship', 'shipped', 'delivered', 'cancelled') NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    company_id CHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_so_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE invoices (
    id CHAR(36) PRIMARY KEY,
    order_id CHAR(36) NOT NULL,
    order_type ENUM('purchase', 'sales') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('draft', 'issued', 'paid', 'overdue', 'cancelled') NOT NULL,
    company_id CHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE payments (
    id CHAR(36) PRIMARY KEY,
    invoice_id CHAR(36) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATETIME NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'check', 'credit_card') NOT NULL,
    company_id CHAR(36) NOT NULL,
    CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE financial_plans (
    id CHAR(36) PRIMARY KEY,
    year INT NOT NULL,
    quarter ENUM('Q1', 'Q2', 'Q3', 'Q4') NOT NULL,
    target_revenue DECIMAL(15, 2) NOT NULL,
    target_expense DECIMAL(15, 2) NOT NULL,
    company_id CHAR(36) NOT NULL,
    CONSTRAINT fk_fplan_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Human Resources
CREATE TABLE employees (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    role VARCHAR(100),
    salary DECIMAL(12, 2),
    factory_id CHAR(36),
    hire_date DATE,
    company_id CHAR(36) NOT NULL,
    CONSTRAINT fk_employee_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;
