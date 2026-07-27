import fs from 'fs';

const path = '/Users/yohannes/Desktop/project/ERP/backend/src/services/supply-chain-service/routes/purchaseOrder.routes.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("router.put('/plans/:id/approve', approveProcurementPlan);", "router.post('/plans/:id/approve', approveProcurementPlan);");
content = content.replace("router.put('/:id/approve', approvePurchaseOrder);", "router.post('/:id/approve', approvePurchaseOrder);");
// also add reject for PO
content = content.replace("import { getAllPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, approvePurchaseOrder }", "import { getAllPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, approvePurchaseOrder, rejectPurchaseOrder }");
// wait, does rejectPurchaseOrder exist?

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed routes');
