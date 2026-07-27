import fs from 'fs';

const fixController = (filePath, entityName, table, insertFields, insertValues, idCheckQuery, checkMsg) => {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  const createRegex = new RegExp(`export const create${entityName} = async \\(req, res\\) => \\{[\\s\\S]*?catch \\(error\\) \\{[\\s\\S]*?\\}\\s*\\};`);
  
  const newCreate = `export const create${entityName} = async (req, res) => {
  try {
    const body = req.body;
    const finalCompanyId = body.companyId || body.company_id;
    const year = body.year;
    
    // For specific checks (production, procurement, sales)
    if ('${entityName}' !== 'FinancialPlan') {
      const finalFactoryId = body.factoryId || body.factory_id;
      const finalProductId = body.productId || body.product_id;
      const finalMaterialId = body.materialId || body.material_id;
      const finalWarehouseId = body.warehouseId || body.warehouse_id;
      const finalRegionId = body.regionId || body.region_id;
      const finalCustomerId = body.customerId || body.customer_id;
      
      let checkArgs = [];
      if ('${entityName}' === 'ProductionPlan') checkArgs = [finalFactoryId, finalProductId, year];
      if ('${entityName}' === 'ProcurementPlan') checkArgs = [finalFactoryId, finalWarehouseId, finalMaterialId, year];
      if ('${entityName}' === 'SalesPlan') checkArgs = [finalRegionId, finalCustomerId, finalProductId, year];

      const [existing] = await pool.query('${idCheckQuery}', checkArgs);
      if (existing.length > 0) {
        return res.status(400).json({ error: '${checkMsg}' });
      }
    } else {
      const [existing] = await pool.query('${idCheckQuery}', [finalCompanyId, year, body.quarter || null]);
      if (existing.length > 0) {
        return res.status(400).json({ error: '${checkMsg}' });
      }
    }

    const newId = crypto.randomUUID();
    
    // Map fields
    const finalTotalQty = body.totalQuantity || body.total_quantity;
    const finalStatus = body.status || 'draft';
    const finalQuarterlyPlans = JSON.stringify(body.quarterlyPlans || body.quarterly_plans || []);
    const createdBy = body.createdBy || null;

    let args = [];
    if ('${entityName}' === 'ProductionPlan') {
      args = [newId, body.factoryId || body.factory_id, body.productId || body.product_id, year, finalTotalQty, finalStatus, finalCompanyId, finalQuarterlyPlans, createdBy];
    } else if ('${entityName}' === 'ProcurementPlan') {
      args = [newId, body.factoryId || body.factory_id, body.warehouseId || body.warehouse_id, body.materialId || body.material_id, year, finalTotalQty, finalStatus, finalCompanyId, finalQuarterlyPlans, createdBy];
    } else if ('${entityName}' === 'SalesPlan') {
      args = [newId, body.regionId || body.region_id, body.customerId || body.customer_id, body.productId || body.product_id, year, finalTotalQty, finalStatus, finalCompanyId, finalQuarterlyPlans, createdBy];
    } else if ('${entityName}' === 'FinancialPlan') {
      const targetRev = body.targetRevenue || body.target_revenue;
      const targetExp = body.targetExpense || body.target_expense;
      args = [newId, finalCompanyId, year, body.quarter || null, targetRev, targetExp, finalStatus, createdBy];
    }

    await pool.query(
      'INSERT INTO ${table} (${insertFields}) VALUES (${insertValues})',
      args
    );
    res.status(201).json({ id: newId });
  } catch (error) {
    console.error('Create ${entityName} error:', error);
    res.status(500).json({ error: 'Failed to create ${entityName}', details: error.message });
  }
};`;

  content = content.replace(createRegex, newCreate);
  fs.writeFileSync(filePath, content, 'utf8');
};

fixController(
  '/Users/yohannes/Desktop/project/ERP/backend/src/services/manufacturing-service/controllers/productionPlan.controller.js',
  'ProductionPlan',
  'production_plans',
  'id, factory_id, product_id, year, total_quantity, status, company_id, quarterly_plans, created_by',
  '?, ?, ?, ?, ?, ?, ?, ?, ?',
  'SELECT id FROM production_plans WHERE factory_id = ? AND product_id = ? AND year = ?',
  'A production plan for this factory, product, and year already exists.'
);

fixController(
  '/Users/yohannes/Desktop/project/ERP/backend/src/services/supply-chain-service/controllers/procurementPlan.controller.js',
  'ProcurementPlan',
  'procurement_plans',
  'id, factory_id, warehouse_id, material_id, year, total_quantity, status, company_id, quarterly_plans, created_by',
  '?, ?, ?, ?, ?, ?, ?, ?, ?, ?',
  'SELECT id FROM procurement_plans WHERE factory_id = ? AND warehouse_id = ? AND material_id = ? AND year = ?',
  'A procurement plan for this factory, warehouse, material, and year already exists.'
);

fixController(
  '/Users/yohannes/Desktop/project/ERP/backend/src/services/sales-service/controllers/salesPlan.controller.js',
  'SalesPlan',
  'sales_plans',
  'id, region_id, customer_id, product_id, year, total_quantity, status, company_id, quarterly_plans, created_by',
  '?, ?, ?, ?, ?, ?, ?, ?, ?, ?',
  'SELECT id FROM sales_plans WHERE region_id = ? AND customer_id = ? AND product_id = ? AND year = ?',
  'A sales plan for this region, customer, product, and year already exists.'
);

fixController(
  '/Users/yohannes/Desktop/project/ERP/backend/src/services/finance-service/controllers/financialPlan.controller.js',
  'FinancialPlan',
  'financial_plans',
  'id, company_id, year, quarter, target_revenue, target_expense, status, created_by',
  '?, ?, ?, ?, ?, ?, ?, ?',
  'SELECT id FROM financial_plans WHERE company_id = ? AND year = ? AND quarter = ?',
  'A financial plan for this company, year, and quarter already exists.'
);

console.log('Fixed create methods');
