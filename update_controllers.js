import fs from 'fs';

const fixController = (filePath, rejectRegexPattern, entityName, table) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace rejectX controller entirely.
  // The structure is generally the same.
  const rejectRegex = new RegExp(`export const reject${entityName} = async \\(req, res\\) => \\{[\\s\\S]*?catch \\(error\\) \\{[\\s\\S]*?\\}\\s*\\};`);
  
  const newReject = `export const reject${entityName} = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId, rejectionReason } = req.body;

    const [items] = await pool.query('SELECT created_by FROM ${table} WHERE id = ?', [id]);
    if (items.length === 0) return res.status(404).json({ error: 'Item not found' });
    
    if (items[0].created_by === approverId) {
      return res.status(403).json({ error: 'Maker cannot be the checker. You cannot reject this.' });
    }

    await pool.query(
      'UPDATE ${table} SET status = ?, approved_by = ?, rejection_reason = ? WHERE id = ?',
      ['rejected', approverId, rejectionReason || null, id]
    );
    res.json({ message: '${entityName} rejected successfully' });
  } catch (error) {
    console.error('Error rejecting ${entityName}:', error);
    res.status(500).json({ error: 'Failed to reject ${entityName}' });
  }
};`;

  if (content.match(rejectRegex)) {
    content = content.replace(rejectRegex, newReject);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${entityName} reject controller`);
  } else {
    console.log(`Could not find reject${entityName} in ${filePath}`);
  }
};

fixController('/Users/yohannes/Desktop/project/ERP/backend/src/services/manufacturing-service/controllers/productionPlan.controller.js', '', 'ProductionPlan', 'production_plans');
fixController('/Users/yohannes/Desktop/project/ERP/backend/src/services/supply-chain-service/controllers/procurementPlan.controller.js', '', 'ProcurementPlan', 'procurement_plans');
fixController('/Users/yohannes/Desktop/project/ERP/backend/src/services/sales-service/controllers/salesPlan.controller.js', '', 'SalesPlan', 'sales_plans');
fixController('/Users/yohannes/Desktop/project/ERP/backend/src/services/finance-service/controllers/financialPlan.controller.js', '', 'FinancialPlan', 'financial_plans');
fixController('/Users/yohannes/Desktop/project/ERP/backend/src/services/supply-chain-service/controllers/purchaseOrder.controller.js', '', 'PurchaseOrder', 'purchase_orders');
fixController('/Users/yohannes/Desktop/project/ERP/backend/src/services/supply-chain-service/controllers/purchaseRequisition.controller.js', '', 'PurchaseRequisition', 'purchase_requisitions');

