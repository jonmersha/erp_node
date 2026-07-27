import fs from 'fs';

// Procurement Plan
const procPath = '/Users/yohannes/Desktop/project/ERP/backend/src/services/supply-chain-service/controllers/procurementPlan.controller.js';
if (fs.existsSync(procPath)) {
  let content = fs.readFileSync(procPath, 'utf8');
  const regex = /const finalFactoryId[\s\S]*?\);\n/g;
  const fixedPart = `const [existing] = await pool.query('SELECT * FROM procurement_plans WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Procurement plan not found' });
    const plan = existing[0];

    const finalFactoryId = factoryId || factory_id || plan.factory_id;
    const finalWarehouseId = warehouseId || warehouse_id || plan.warehouse_id;
    const finalMaterialId = materialId || material_id || plan.material_id;
    const finalYear = year !== undefined ? year : plan.year;
    const finalTotalQuantity = totalQuantity || total_quantity || plan.total_quantity;
    const finalStatus = status || plan.status;
    const finalQuarterlyPlans = quarterlyPlans || quarterly_plans || plan.quarterly_plans;

    await pool.query(
      'UPDATE procurement_plans SET factory_id = ?, warehouse_id = ?, material_id = ?, year = ?, total_quantity = ?, status = ?, quarterly_plans = ? WHERE id = ?',
      [finalFactoryId, finalWarehouseId, finalMaterialId, finalYear, finalTotalQuantity, finalStatus, JSON.stringify(finalQuarterlyPlans || []), id]
    );
`;
  content = content.replace(regex, fixedPart);
  fs.writeFileSync(procPath, content, 'utf8');
  console.log('Fixed procurementPlan.controller.js');
}

// Sales Plan
const salesPath = '/Users/yohannes/Desktop/project/ERP/backend/src/services/sales-service/controllers/salesPlan.controller.js';
if (fs.existsSync(salesPath)) {
  let content = fs.readFileSync(salesPath, 'utf8');
  const regex = /const finalFactoryId[\s\S]*?\);\n/g;
  const fixedPart = `const [existing] = await pool.query('SELECT * FROM sales_plans WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Sales plan not found' });
    const plan = existing[0];

    const finalFactoryId = factoryId || factory_id || plan.factory_id;
    const finalProductId = productId || product_id || plan.product_id;
    const finalYear = year !== undefined ? year : plan.year;
    const finalTotalQuantity = totalQuantity || total_quantity || plan.total_quantity;
    const finalStatus = status || plan.status;
    const finalQuarterlyPlans = quarterlyPlans || quarterly_plans || plan.quarterly_plans;

    await pool.query(
      'UPDATE sales_plans SET factory_id = ?, product_id = ?, year = ?, total_quantity = ?, status = ?, quarterly_plans = ? WHERE id = ?',
      [finalFactoryId, finalProductId, finalYear, finalTotalQuantity, finalStatus, JSON.stringify(finalQuarterlyPlans || []), id]
    );
`;
  content = content.replace(regex, fixedPart);
  fs.writeFileSync(salesPath, content, 'utf8');
  console.log('Fixed salesPlan.controller.js');
}

// Financial Plan
const finPath = '/Users/yohannes/Desktop/project/ERP/backend/src/services/finance-service/controllers/financialPlan.controller.js';
if (fs.existsSync(finPath)) {
  let content = fs.readFileSync(finPath, 'utf8');
  const regex = /const finalYear[\s\S]*?\);\n/g;
  const fixedPart = `const [existing] = await pool.query('SELECT * FROM financial_plans WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Financial plan not found' });
    const plan = existing[0];

    const finalYear = year !== undefined ? year : plan.year;
    const finalQuarter = quarter || plan.quarter;
    const finalTargetRevenue = targetRevenue || target_revenue || plan.target_revenue;
    const finalTargetExpense = targetExpense || target_expense || plan.target_expense;
    const finalStatus = status || plan.status;

    await pool.query(
      'UPDATE financial_plans SET year = ?, quarter = ?, target_revenue = ?, target_expense = ?, status = ? WHERE id = ?',
      [finalYear, finalQuarter, finalTargetRevenue, finalTargetExpense, finalStatus, id]
    );
`;
  content = content.replace(regex, fixedPart);
  fs.writeFileSync(finPath, content, 'utf8');
  console.log('Fixed financialPlan.controller.js');
}
