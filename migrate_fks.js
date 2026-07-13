import pool from './src/db.js';

const migrate = async () => {
  console.log('Starting migration to enforce foreign keys...');
  try {
    // 1. Delete orphaned records before applying foreign keys
    console.log('Cleaning up orphaned records...');
    
    // products.category -> products.category_id
    // If the old column was category, we should find matching categories(name) and set category_id.
    // Wait, first we need to add category_id column if it doesn't exist.
    
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Modify products table to drop category and add category_id
    try {
      await pool.query('ALTER TABLE products ADD COLUMN category_id CHAR(36) AFTER name');
      
      // Update category_id based on category name
      await pool.query('UPDATE products p JOIN categories c ON p.category = c.name SET p.category_id = c.id');
      
      // Drop old category column
      await pool.query('ALTER TABLE products DROP COLUMN category');
    } catch (e) {
      console.log('Products table already migrated or error:', e.message);
    }
    
    const constraints = [
      { table: 'warehouses', fk: 'fk_warehouse_factory', add: 'FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE' },
      { table: 'products', fk: 'fk_product_category', add: 'FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE' },
      { table: 'employees', fk: 'fk_employee_factory', add: 'FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE' },
      { table: 'purchase_orders', fk: 'fk_po_supplier', add: 'FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE' },
      { table: 'purchase_orders', fk: 'fk_po_factory', add: 'FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE' },
      { table: 'purchase_orders', fk: 'fk_po_warehouse', add: 'FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE' },
      { table: 'sales_orders', fk: 'fk_so_customer', add: 'FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE' },
      { table: 'sales_orders', fk: 'fk_so_outlet', add: 'FOREIGN KEY (outlet_id) REFERENCES sales_outlets(id) ON DELETE CASCADE' },
      { table: 'production_runs', fk: 'fk_run_factory', add: 'FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE' },
      { table: 'production_runs', fk: 'fk_run_product', add: 'FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE' },
      { table: 'production_runs', fk: 'fk_run_recipe', add: 'FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE' },
      { table: 'procurement_plans', fk: 'fk_procplan_factory', add: 'FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE' },
      { table: 'procurement_plans', fk: 'fk_procplan_warehouse', add: 'FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE' },
      { table: 'procurement_plans', fk: 'fk_procplan_material', add: 'FOREIGN KEY (material_id) REFERENCES raw_materials(id) ON DELETE CASCADE' },
      { table: 'sales_plans', fk: 'fk_salesplan_factory', add: 'FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE' },
      { table: 'sales_plans', fk: 'fk_salesplan_product', add: 'FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE' },
      { table: 'recipes', fk: 'fk_recipe_product', add: 'FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE' },
      { table: 'grns', fk: 'fk_grn_po', add: 'FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE' },
      { table: 'grns', fk: 'fk_grn_warehouse', add: 'FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE' },
      { table: 'delivery_notes', fk: 'fk_dn_so', add: 'FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE' },
      { table: 'delivery_notes', fk: 'fk_dn_outlet', add: 'FOREIGN KEY (outlet_id) REFERENCES sales_outlets(id) ON DELETE CASCADE' },
      { table: 'production_plans', fk: 'fk_prodplan_factory', add: 'FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE' },
      { table: 'production_plans', fk: 'fk_prodplan_product', add: 'FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE' },
      { table: 'users', fk: 'fk_user_unit', add: 'FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL' }
    ];

    for (const c of constraints) {
      try {
        // Drop existing to avoid duplicates if re-running
        await pool.query(`ALTER TABLE ${c.table} DROP FOREIGN KEY ${c.fk}`);
      } catch (e) {
        // Ignore if doesn't exist
      }
      try {
        console.log(`Adding ${c.fk} to ${c.table}...`);
        await pool.query(`ALTER TABLE ${c.table} ADD CONSTRAINT ${c.fk} ${c.add}`);
      } catch (e) {
        console.error(`Failed to add constraint ${c.fk}:`, e.message);
        
        // Clean orphaned records and retry
        console.log(`Attempting to clean orphaned records for ${c.table}...`);
        
        // Extract the target table from the add string, e.g. REFERENCES factories(id)
        const match = c.add.match(/REFERENCES\s+([a-zA-Z_]+)\(([a-zA-Z_]+)\)/);
        const sourceColMatch = c.add.match(/FOREIGN KEY\s*\(([a-zA-Z_]+)\)/);
        
        if (match && sourceColMatch) {
          const targetTable = match[1];
          const targetCol = match[2];
          const sourceCol = sourceColMatch[1];
          
          await pool.query(`
            DELETE FROM ${c.table} 
            WHERE ${sourceCol} IS NOT NULL 
            AND ${sourceCol} NOT IN (SELECT ${targetCol} FROM ${targetTable})
          `);
          
          console.log(`Retrying to add ${c.fk}...`);
          await pool.query(`ALTER TABLE ${c.table} ADD CONSTRAINT ${c.fk} ${c.add}`);
          console.log(`Successfully added ${c.fk} after cleanup.`);
        }
      }
    }

    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
};

migrate();
