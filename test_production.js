import { createProductionRun } from './src/controllers/production.controller.js';
import pool from './src/db.js';

const req = {
  body: {
    factoryId: 'factory-123',
    productId: 'product-123',
    recipeId: 'recipe-123',
    quantityPlanned: 10,
    status: 'in_progress',
    companyId: '39eeefea-8f69-4d55-8f97-e10f130ca68d',
  },
  user: { uid: 'test-user-1' }
};

const res = {
  status: (code) => ({
    json: (data) => {
      console.log('STATUS:', code, 'DATA:', data);
      checkInventory();
    }
  }),
  json: (data) => {
    console.log('SUCCESS JSON:', data);
    checkInventory();
  }
};

async function checkInventory() {
  const [inv] = await pool.query("SELECT * FROM inventory WHERE item_id = 'wheat-123'");
  console.log('INVENTORY AFTER:', inv);
  process.exit(0);
}

async function setupAndRun() {
  try {
    // 1. Setup raw material inventory
    await pool.query("DELETE FROM inventory WHERE item_id = 'wheat-123'");
    await pool.query("INSERT INTO inventory (id, unit_id, item_id, item_type, quantity, company_id) VALUES ('inv-test-1', 'warehouse-1', 'wheat-123', 'material', 1000, '39eeefea-8f69-4d55-8f97-e10f130ca68d')");
    // Add products and factories first
    await pool.query("INSERT IGNORE INTO factories (id, name, type, company_id) VALUES ('factory-123', 'Test Factory', 'manufacturing', '39eeefea-8f69-4d55-8f97-e10f130ca68d')");
    await pool.query("INSERT IGNORE INTO products (id, name, category, unit, company_id) VALUES ('product-123', 'Test Product', 'flour', 'kg', '39eeefea-8f69-4d55-8f97-e10f130ca68d')");
    await pool.query("INSERT IGNORE INTO raw_materials (id, name, unit, company_id) VALUES ('wheat-123', 'Test Wheat', 'kg', '39eeefea-8f69-4d55-8f97-e10f130ca68d')");

    // 2. Setup recipe
    await pool.query("DELETE FROM recipes WHERE id = 'recipe-123'");
    await pool.query("INSERT INTO recipes (id, product_id, name, bom, processing_steps, company_id) VALUES ('recipe-123', 'product-123', 'Test Recipe', ?, ?, '39eeefea-8f69-4d55-8f97-e10f130ca68d')", [
      JSON.stringify([{ itemId: 'wheat-123', quantity: 5 }]), // 5 units of wheat per 1 unit of product
      '[]'
    ]);
    
    console.log('Running test...');
    await createProductionRun(req, res);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

setupAndRun();
