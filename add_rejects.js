import fs from 'fs';

const prodCtrl = '/Users/yohannes/Desktop/project/ERP/backend/src/services/manufacturing-service/controllers/productionPlan.controller.js';
if (fs.existsSync(prodCtrl)) {
  let content = fs.readFileSync(prodCtrl, 'utf8');
  if (!content.includes('export const rejectProductionPlan')) {
    content += `\nexport const rejectProductionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId } = req.body;
    const [plans] = await pool.query('SELECT created_by FROM production_plans WHERE id = ?', [id]);
    if (plans.length === 0) return res.status(404).json({ error: 'Plan not found' });
    if (plans[0].created_by === approverId) return res.status(403).json({ error: 'Maker cannot be the checker. You cannot reject this plan.' });
    await pool.query('UPDATE production_plans SET status = ?, approved_by = ? WHERE id = ?', ['rejected', approverId, id]);
    res.json({ message: 'Plan rejected successfully' });
  } catch (error) { res.status(500).json({ error: 'Failed to reject plan' }); }
};\n`;
    fs.writeFileSync(prodCtrl, content, 'utf8');
    console.log('Added rejectProductionPlan');
  }
}

const salesCtrl = '/Users/yohannes/Desktop/project/ERP/backend/src/services/sales-service/controllers/salesPlan.controller.js';
if (fs.existsSync(salesCtrl)) {
  let content = fs.readFileSync(salesCtrl, 'utf8');
  if (!content.includes('export const rejectSalesPlan')) {
    content += `\nexport const rejectSalesPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId } = req.body;
    const [plans] = await pool.query('SELECT created_by FROM sales_plans WHERE id = ?', [id]);
    if (plans.length === 0) return res.status(404).json({ error: 'Plan not found' });
    if (plans[0].created_by === approverId) return res.status(403).json({ error: 'Maker cannot be the checker. You cannot reject this plan.' });
    await pool.query('UPDATE sales_plans SET status = ?, approved_by = ? WHERE id = ?', ['rejected', approverId, id]);
    res.json({ message: 'Plan rejected successfully' });
  } catch (error) { res.status(500).json({ error: 'Failed to reject plan' }); }
};\n`;
    fs.writeFileSync(salesCtrl, content, 'utf8');
    console.log('Added rejectSalesPlan');
  }
}
