import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const services = {
  'hr-service': ['employee.routes.js', 'attendance.routes.js', 'leave.routes.js', 'department.routes.js'],
  'supply-chain-service': ['procurement.routes.js', 'procurementPlan.routes.js', 'sourcing.routes.js', 'inventory.routes.js', 'logistics.routes.js', 'rawMaterial.routes.js', 'purchaseOrder.routes.js', 'purchaseRequisition.routes.js', 'supplier.routes.js', 'warehouse.routes.js', 'grn.routes.js', 'deliveryNote.routes.js', 'weighbridge.routes.js'],
  'manufacturing-service': ['production.routes.js', 'productionPlan.routes.js', 'productionGroup.routes.js', 'recipe.routes.js'],
  'finance-service': ['finance.routes.js', 'financialPlan.routes.js', 'expense.routes.js'],
  'sales-service': ['sales.routes.js', 'salesOrder.routes.js', 'outlet.routes.js', 'crm.routes.js'],
  'quality-maintenance-service': ['quality.routes.js', 'qualityInspection.routes.js', 'maintenance.routes.js', 'fleet.routes.js'],
  'master-data-service': ['company.routes.js', 'user.routes.js', 'role.routes.js', 'factory.routes.js', 'category.routes.js', 'product.routes.js', 'workflow.routes.js', 'reports.routes.js', 'backup.routes.js']
};

const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

for (const [service, files] of Object.entries(services)) {
  for (const file of files) {
    const searchString = `./src/routes/${file}`;
    const replaceString = `./src/services/${service}/routes/${file}`;
    serverContent = serverContent.replace(searchString, replaceString);
  }
}

fs.writeFileSync(serverPath, serverContent);
console.log('server.js updated');
