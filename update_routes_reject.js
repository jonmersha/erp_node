import fs from 'fs';

const path = '/Users/yohannes/Desktop/project/ERP/backend/src/services/supply-chain-service/routes/purchaseOrder.routes.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("import { getAllProcurementPlans, createProcurementPlan, updateProcurementPlan, deleteProcurementPlan, approveProcurementPlan } from '../controllers/procurementPlan.controller.js';", "import { getAllProcurementPlans, createProcurementPlan, updateProcurementPlan, deleteProcurementPlan, approveProcurementPlan, rejectProcurementPlan } from '../controllers/procurementPlan.controller.js';");

content = content.replace("router.post('/plans/:id/approve', approveProcurementPlan);", "router.post('/plans/:id/approve', approveProcurementPlan);\nrouter.post('/plans/:id/reject', rejectProcurementPlan);");

content = content.replace("router.post('/:id/approve', approvePurchaseOrder);", "router.post('/:id/approve', approvePurchaseOrder);\nrouter.post('/:id/reject', rejectPurchaseOrder);");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed reject routes');
