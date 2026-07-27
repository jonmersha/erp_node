import fs from 'fs';

const fixController = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    /if \(existing\.length > 0\) \{\s*return res\.status\(400\)\.json\(\{ error: '(.*?)' \}\);\s*\}/g,
    "if (existing.length > 0) {\n        return res.status(400).json({ error: '$1', existingId: existing[0].id });\n      }"
  );
  fs.writeFileSync(filePath, content, 'utf8');
};

fixController('/Users/yohannes/Desktop/project/ERP/backend/src/services/manufacturing-service/controllers/productionPlan.controller.js');
fixController('/Users/yohannes/Desktop/project/ERP/backend/src/services/supply-chain-service/controllers/procurementPlan.controller.js');
fixController('/Users/yohannes/Desktop/project/ERP/backend/src/services/sales-service/controllers/salesPlan.controller.js');
fixController('/Users/yohannes/Desktop/project/ERP/backend/src/services/finance-service/controllers/financialPlan.controller.js');

console.log('Added existingId to controllers');
