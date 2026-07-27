import fs from 'fs';

const prodPath = '/Users/yohannes/Desktop/project/ERP/backend/src/services/manufacturing-service/routes/production.routes.js';
if (fs.existsSync(prodPath)) {
  let content = fs.readFileSync(prodPath, 'utf8');
  content = content.replace("router.put('/plans/:id/approve', approveProductionPlan);", "router.post('/plans/:id/approve', approveProductionPlan);\nrouter.post('/plans/:id/reject', rejectProductionPlan);");
  // need to import rejectProductionPlan
  content = content.replace("import { getAllProductionPlans, createProductionPlan, updateProductionPlan, deleteProductionPlan, approveProductionPlan }", "import { getAllProductionPlans, createProductionPlan, updateProductionPlan, deleteProductionPlan, approveProductionPlan, rejectProductionPlan }");
  fs.writeFileSync(prodPath, content, 'utf8');
}

const salesPath = '/Users/yohannes/Desktop/project/ERP/backend/src/services/sales-service/routes/salesOrder.routes.js';
if (fs.existsSync(salesPath)) {
  let content = fs.readFileSync(salesPath, 'utf8');
  content = content.replace("router.put('/plans/:id/approve', approveSalesPlan);", "router.post('/plans/:id/approve', approveSalesPlan);\nrouter.post('/plans/:id/reject', rejectSalesPlan);");
  content = content.replace("import { getAllSalesPlans, createSalesPlan, updateSalesPlan, deleteSalesPlan, approveSalesPlan }", "import { getAllSalesPlans, createSalesPlan, updateSalesPlan, deleteSalesPlan, approveSalesPlan, rejectSalesPlan }");
  fs.writeFileSync(salesPath, content, 'utf8');
}
console.log('Fixed remaining routes');
