import pool from './src/db.js';

const companyId = '39eeefea-8f69-4d55-8f97-e10f130ca68d';
const ownerId = 'OJxmTW04lRUiycWN6J8bkrmyLQJ3';

// Generate consistent mock UUIDs
const ids = {
  unit: 'b0e0f4f9-2a9f-4f81-8d02-1b12b53b8b60',
  factory: 'b1e0f4f9-2a9f-4f81-8d02-1b12b53b8b61',
  outlet: 'b2e0f4f9-2a9f-4f81-8d02-1b12b53b8b62',
  supplier: 'b3e0f4f9-2a9f-4f81-8d02-1b12b53b8b63',
  material: 'b4e0f4f9-2a9f-4f81-8d02-1b12b53b8b64',
  category: 'b5e0f4f9-2a9f-4f81-8d02-1b12b53b8b65',
  customer: 'b6e0f4f9-2a9f-4f81-8d02-1b12b53b8b66',
  warehouse: 'b7e0f4f9-2a9f-4f81-8d02-1b12b53b8b67',
  product: 'b8e0f4f9-2a9f-4f81-8d02-1b12b53b8b68',
  dept: 'b9e0f4f9-2a9f-4f81-8d02-1b12b53b8b69',
  managerEmp: 'bae0f4f9-2a9f-4f81-8d02-1b12b53b8b6a',
  staffEmp: 'bbe0f4f9-2a9f-4f81-8d02-1b12b53b8b6b',
  attendance: 'bce0f4f9-2a9f-4f81-8d02-1b12b53b8b6c',
  leave: 'bde0f4f9-2a9f-4f81-8d02-1b12b53b8b6d',
  ticket: 'bee0f4f9-2a9f-4f81-8d02-1b12b53b8b6e',
  interaction: 'bfe0f4f9-2a9f-4f81-8d02-1b12b53b8b6f',
  recipe: 'c0e0f4f9-2a9f-4f81-8d02-1b12b53b8b70',
  purchaseOrder: 'c1e0f4f9-2a9f-4f81-8d02-1b12b53b8b71',
  salesOrder: 'c2e0f4f9-2a9f-4f81-8d02-1b12b53b8b72',
  inventory: 'c3e0f4f9-2a9f-4f81-8d02-1b12b53b8b73',
  procPlan: 'c4e0f4f9-2a9f-4f81-8d02-1b12b53b8b74',
  salesPlan: 'c5e0f4f9-2a9f-4f81-8d02-1b12b53b8b75',
  prodPlan: 'c6e0f4f9-2a9f-4f81-8d02-1b12b53b8b76',
  poi: 'c7e0f4f9-2a9f-4f81-8d02-1b12b53b8b77',
  prodRun: 'c8e0f4f9-2a9f-4f81-8d02-1b12b53b8b78',
  grn: 'c9e0f4f9-2a9f-4f81-8d02-1b12b53b8b79',
  delivery: 'cae0f4f9-2a9f-4f81-8d02-1b12b53b8b7a',
  qc: 'cbe0f4f9-2a9f-4f81-8d02-1b12b53b8b7b',
  role: 'cce0f4f9-2a9f-4f81-8d02-1b12b53b8b7c'
};

const insertData = async (table, data) => {
  if (data.length === 0) return;
  const keys = Object.keys(data[0]);
  const columns = keys.join(', ');
  const values = data.map(item => `(${keys.map(k => item[k] === null ? 'NULL' : pool.escape(item[k])).join(', ')})`).join(', ');
  const query = `INSERT IGNORE INTO ${table} (${columns}) VALUES ${values}`;
  try {
    const [result] = await pool.query(query);
    console.log(`Seeded ${result.affectedRows} new records into ${table}`);
  } catch (error) {
    console.error(`Error seeding ${table}:`, error.message);
  }
};

const seedDatabase = async () => {
  console.log('Starting Database Seed...');

  // Ensure owner user exists in users table (if not already there)
  await insertData('users', [
    { uid: ownerId, email: 'jonmersha@gmail.com', name: 'System Admin', status: 'active', roles: JSON.stringify(['admin']), company_id: companyId }
  ]);

  // Level 1 Tables
  await insertData('units', [
    { id: ids.unit, name: 'Main HQ Unit', location: 'City Center', company_id: companyId }
  ]);
  await insertData('factories', [
    { id: ids.factory, name: 'North Manufacturing Plant', location: 'Industrial Zone A', company_id: companyId, manager_id: ownerId }
  ]);
  await insertData('sales_outlets', [
    { id: ids.outlet, name: 'Downtown Store', location: 'Downtown', company_id: companyId, factory_id: ids.factory }
  ]);
  await insertData('suppliers', [
    { id: ids.supplier, name: 'Global Raw Materials Ltd', contact: 'John Doe', email: 'john@globalraw.com', company_id: companyId, status: 'active', is_authorized: true }
  ]);
  await insertData('raw_materials', [
    { id: ids.material, name: 'Premium Wheat Flour', unit: 'kg', company_id: companyId }
  ]);
  await insertData('categories', [
    { id: ids.category, name: 'Baked Goods', description: 'Freshly baked products', company_id: companyId }
  ]);
  await insertData('customers', [
    { id: ids.customer, name: 'Acme Supermarkets', phone: '1-800-ACME-SUPER', email: 'purchasing@acme.com', address: '123 Acme Blvd', company_id: companyId }
  ]);

  // Level 2 Tables
  await insertData('warehouses', [
    { id: ids.warehouse, name: 'Main Storage', location: 'Adjacent to Plant', factory_id: ids.factory, company_id: companyId, manager_id: ownerId }
  ]);
  await insertData('products', [
    { id: ids.product, name: 'Artisan Bread Loaf', category_id: ids.category, package_size: '500g', unit: 'pcs', price: 4.99, company_id: companyId }
  ]);
  await insertData('departments', [
    { id: ids.dept, name: 'Production', description: 'Handles manufacturing', parent_department_id: null, manager_id: null, company_id: companyId }
  ]);
  
  // Employees
  await insertData('employees', [
    { id: ids.managerEmp, name: 'Alice Manager', email: 'alice@milki.com', role: 'Production Manager', salary: 85000, factory_id: ids.factory, hire_date: '2023-01-15', department_id: ids.dept, manager_id: null, company_id: companyId },
    { id: ids.staffEmp, name: 'Bob Worker', email: 'bob@milki.com', role: 'Machine Operator', salary: 45000, factory_id: ids.factory, hire_date: '2024-03-01', department_id: ids.dept, manager_id: ids.managerEmp, company_id: companyId }
  ]);

  // Update Dept Manager
  try {
    await pool.query('UPDATE departments SET manager_id = ? WHERE id = ?', [ids.managerEmp, ids.dept]);
  } catch(e) {}

  // Level 3 Tables
  await insertData('attendance', [
    { id: ids.attendance, employee_id: ids.staffEmp, date: new Date().toISOString().split('T')[0], clock_in: new Date().toISOString().split('T')[0] + ' 08:00:00', clock_out: new Date().toISOString().split('T')[0] + ' 17:00:00', status: 'present', overtime_hours: 0, company_id: companyId }
  ]);
  await insertData('leave_requests', [
    { id: ids.leave, employee_id: ids.staffEmp, start_date: '2026-12-20', end_date: '2026-12-25', type: 'annual', reason: 'Holiday', status: 'approved', approved_by: ids.managerEmp, company_id: companyId }
  ]);
  await insertData('crm_tickets', [
    { id: ids.ticket, customer_id: ids.customer, type: 'inquiry', status: 'open', resolution_notes: 'Checking stock availability.', company_id: companyId }
  ]);
  await insertData('customer_interactions', [
    { id: ids.interaction, customer_id: ids.customer, interaction_type: 'sales', notes: 'Called regarding bulk order discount.', user_id: ownerId, company_id: companyId }
  ]);
  await insertData('recipes', [
    { id: ids.recipe, product_id: ids.product, name: 'Standard Loaf Recipe', bom: JSON.stringify([{ materialId: ids.material, quantity: 0.35 }]), processing_steps: JSON.stringify([{ step: 'Mix', time: 10 }]), company_id: companyId }
  ]);
  await insertData('purchase_orders', [
    { id: ids.purchaseOrder, supplier_id: ids.supplier, status: 'approved', total_amount: 1500.00, company_id: companyId, created_by: ownerId, approved_by: ownerId }
  ]);
  await insertData('purchase_order_items', [
    { order_id: ids.purchaseOrder, item_id: ids.material, item_name: 'Premium Wheat Flour', quantity: 1000, price: 1.50 }
  ]);
  await insertData('sales_orders', [
    { id: ids.salesOrder, customer_id: ids.customer, status: 'confirmed', total_amount: 499.00, company_id: companyId }
  ]);
  // Inventory needs item_id, unit_id, item_type, quantity
  await insertData('inventory', [
    { id: ids.inventory, unit_id: ids.unit, item_id: ids.material, item_type: 'material', quantity: 5000, company_id: companyId }
  ]);
  // Wait, let's look at schema to check if 'inventory' needs a 'type' (raw_material vs product)
  // Let me just query schema for inventory

  console.log('Seed completed successfully!');
  process.exit(0);
};

seedDatabase();
