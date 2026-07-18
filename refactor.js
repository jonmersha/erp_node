import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const services = {
  'hr-service': {
    routes: ['employee.routes.js', 'attendance.routes.js', 'leave.routes.js', 'department.routes.js'],
    controllers: ['employee.controller.js', 'attendance.controller.js', 'leave.controller.js', 'department.controller.js']
  },
  'supply-chain-service': {
    routes: ['procurement.routes.js', 'procurementPlan.routes.js', 'sourcing.routes.js', 'inventory.routes.js', 'logistics.routes.js', 'rawMaterial.routes.js', 'purchaseOrder.routes.js', 'purchaseRequisition.routes.js', 'supplier.routes.js', 'warehouse.routes.js', 'grn.routes.js', 'deliveryNote.routes.js', 'weighbridge.routes.js'],
    controllers: ['procurementPlan.controller.js', 'sourcing.controller.js', 'inventory.controller.js', 'rawMaterial.controller.js', 'purchaseOrder.controller.js', 'purchaseRequisition.controller.js', 'supplier.controller.js', 'warehouse.controller.js', 'grn.controller.js', 'deliveryNote.controller.js', 'weighbridge.controller.js']
  },
  'manufacturing-service': {
    routes: ['production.routes.js', 'productionPlan.routes.js', 'productionGroup.routes.js', 'recipe.routes.js'],
    controllers: ['production.controller.js', 'productionPlan.controller.js', 'recipe.controller.js']
  },
  'finance-service': {
    routes: ['finance.routes.js', 'financialPlan.routes.js', 'expense.routes.js'],
    controllers: ['expense.controller.js']
  },
  'sales-service': {
    routes: ['sales.routes.js', 'salesOrder.routes.js', 'outlet.routes.js', 'crm.routes.js'],
    controllers: ['salesOrder.controller.js', 'salesPlan.controller.js', 'outlet.controller.js', 'crm.controller.js']
  },
  'quality-maintenance-service': {
    routes: ['quality.routes.js', 'qualityInspection.routes.js', 'maintenance.routes.js', 'fleet.routes.js'],
    controllers: ['quality.controller.js', 'qualityInspection.controller.js', 'fleet.controller.js']
  },
  'master-data-service': {
    routes: ['company.routes.js', 'user.routes.js', 'role.routes.js', 'factory.routes.js', 'category.routes.js', 'product.routes.js', 'workflow.routes.js', 'reports.routes.js', 'backup.routes.js'],
    controllers: ['company.controller.js', 'user.controller.js', 'role.controller.js', 'factory.controller.js', 'category.controller.js', 'product.controller.js', 'workflow.controller.js', 'reports.controller.js', 'backup.controller.js']
  }
};

const srcDir = path.join(__dirname, 'src');

for (const [service, files] of Object.entries(services)) {
  for (const type of ['routes', 'controllers']) {
    for (const file of files[type]) {
      const oldPath = path.join(srcDir, type, file);
      const newPath = path.join(srcDir, 'services', service, type, file);

      if (fs.existsSync(oldPath)) {
        let content = fs.readFileSync(oldPath, 'utf8');

        if (type === 'routes') {
          // Update controller import path in routes
          content = content.replace(/from '\.\.\/controllers\//g, "from '../controllers/");
        } else if (type === 'controllers') {
          // Update db import path in controllers
          content = content.replace(/from '\.\.\/db\.js'/g, "from '../../../db.js'");
        }

        fs.writeFileSync(newPath, content);
        fs.unlinkSync(oldPath);
        console.log(`Moved ${file} to ${service}/${type}`);
      } else {
        console.warn(`File not found: ${oldPath}`);
      }
    }
  }

  // Create an index.js for the service
  const serviceIndex = path.join(srcDir, 'services', service, 'index.js');
  let indexContent = "import { Router } from 'express';\n\nconst router = Router();\n\n";
  for (const file of files.routes) {
    if (fs.existsSync(path.join(srcDir, 'services', service, 'routes', file))) {
      const baseName = file.split('.')[0];
      const routeName = baseName + 'Routes';
      indexContent += `import ${routeName} from './routes/${file}';\n`;
      indexContent += `router.use('/${baseName}', ${routeName});\n`;
    }
  }
  indexContent += "\nexport default router;\n";
  fs.writeFileSync(serviceIndex, indexContent);
}

console.log('Refactoring complete.');
