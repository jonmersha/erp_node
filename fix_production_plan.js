import fs from 'fs';

const path = '/Users/yohannes/Desktop/project/ERP/backend/src/services/manufacturing-service/controllers/productionPlan.controller.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /const finalFactoryId[\s\S]*?\);\n/g;

const fixedPart = `const [existing] = await pool.query('SELECT * FROM production_plans WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Production plan not found' });
    const plan = existing[0];

    const finalFactoryId = factoryId || factory_id || plan.factory_id;
    const finalProductId = productId || product_id || plan.product_id;
    const finalYear = year !== undefined ? year : plan.year;
    const finalTotalQuantity = totalQuantity || total_quantity || plan.total_quantity;
    const finalStatus = status || plan.status;
    const finalQuarterlyPlans = quarterlyPlans || quarterly_plans || plan.quarterly_plans;

    await pool.query(
      'UPDATE production_plans SET factory_id = ?, product_id = ?, year = ?, total_quantity = ?, status = ?, quarterly_plans = ? WHERE id = ?',
      [finalFactoryId, finalProductId, finalYear, finalTotalQuantity, finalStatus, JSON.stringify(finalQuarterlyPlans || []), id]
    );
`;

content = content.replace(regex, fixedPart);
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed productionPlan.controller.js');
