import fs from 'fs';

const filePath = '/Users/yohannes/Desktop/project/ERP/backend/src/services/sales-service/controllers/salesPlan.controller.js';
let content = fs.readFileSync(filePath, 'utf8');

// The bug is in createSalesPlan. Let's rewrite createSalesPlan entirely to match the correct schema
const createRegex = new RegExp(`export const createSalesPlan = async \\(req, res\\) => \\{[\\s\\S]*?catch \\(error\\) \\{[\\s\\S]*?\\}\\s*\\};`);

const newCreate = `export const createSalesPlan = async (req, res) => {
  try {
    const body = req.body;
    const finalCompanyId = body.companyId || body.company_id;
    const year = body.year;
    const finalFactoryId = body.factoryId || body.factory_id;
    const finalProductId = body.productId || body.product_id;
      
    const [existing] = await pool.query('SELECT id FROM sales_plans WHERE factory_id = ? AND product_id = ? AND year = ?', [finalFactoryId, finalProductId, year]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'A sales plan for this factory, product, and year already exists.', existingId: existing[0].id });
    }

    const newId = crypto.randomUUID();
    const finalTotalQty = body.totalQuantity || body.total_quantity;
    const finalStatus = body.status || 'draft';
    const finalQuarterlyPlans = JSON.stringify(body.quarterlyPlans || body.quarterly_plans || []);
    const createdBy = body.createdBy || null;

    const args = [newId, finalFactoryId, finalProductId, year, finalTotalQty, finalStatus, finalCompanyId, finalQuarterlyPlans, createdBy];

    await pool.query(
      'INSERT INTO sales_plans (id, factory_id, product_id, year, total_quantity, status, company_id, quarterly_plans, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args
    );
    res.status(201).json({ id: newId });
  } catch (error) {
    console.error('Create SalesPlan error:', error);
    res.status(500).json({ error: 'Failed to create SalesPlan', details: error.message });
  }
};`;

content = content.replace(createRegex, newCreate);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed salesPlan.controller.js');
