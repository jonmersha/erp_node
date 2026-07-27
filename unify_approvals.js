import fs from 'fs';

// Frontend
const planPath = '/Users/yohannes/Desktop/project/ERP/Frontend/src/services/planningService.ts';
let planContent = fs.readFileSync(planPath, 'utf8');
planContent = planContent.replace(/apiService\.put\(\`(.*?)\/approve\`/g, 'apiService.post(`$1/approve`');
planContent = planContent.replace(/apiService\.put\(\`(.*?)\/reject\`/g, 'apiService.post(`$1/reject`');
fs.writeFileSync(planPath, planContent, 'utf8');

const procPath = '/Users/yohannes/Desktop/project/ERP/Frontend/src/services/procurementService.ts';
let procContent = fs.readFileSync(procPath, 'utf8');
procContent = procContent.replace(/apiService\.put\(\`(.*?)\/approve\`/g, 'apiService.post(`$1/approve`');
procContent = procContent.replace(/apiService\.put\(\`(.*?)\/reject\`/g, 'apiService.post(`$1/reject`');
fs.writeFileSync(procPath, procContent, 'utf8');

// Backend
const pRoutes = '/Users/yohannes/Desktop/project/ERP/backend/src/services/supply-chain-service/routes/purchaseOrder.routes.js';
let pContent = fs.readFileSync(pRoutes, 'utf8');
pContent = pContent.replace(/router\.put\('/g, "router.put('"); // dummy
pContent = pContent.replace(/router\.put\('(.*?)\/approve'/g, "router.post('$1/approve'");
pContent = pContent.replace(/router\.put\('(.*?)\/reject'/g, "router.post('$1/reject'");
fs.writeFileSync(pRoutes, pContent, 'utf8');

const sRoutes = '/Users/yohannes/Desktop/project/ERP/backend/src/services/supply-chain-service/routes/supplier.routes.js';
let sContent = fs.readFileSync(sRoutes, 'utf8');
sContent = sContent.replace(/router\.put\('(.*?)\/approve'/g, "router.post('$1/approve'");
sContent = sContent.replace(/router\.put\('(.*?)\/reject'/g, "router.post('$1/reject'");
fs.writeFileSync(sRoutes, sContent, 'utf8');

const prRoutes = '/Users/yohannes/Desktop/project/ERP/backend/src/services/supply-chain-service/routes/purchaseRequisition.routes.js';
let prContent = fs.readFileSync(prRoutes, 'utf8');
prContent = prContent.replace(/router\.put\('(.*?)\/approve'/g, "router.post('$1/approve'");
prContent = prContent.replace(/router\.put\('(.*?)\/reject'/g, "router.post('$1/reject'");
fs.writeFileSync(prRoutes, prContent, 'utf8');

console.log('Unified to POST');
