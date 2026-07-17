import express from 'express';
import cors from 'cors';
import { authenticateToken } from './src/middleware/auth.js';
import procurementRoutes from './src/routes/procurement.routes.js';
import salesRoutes from './src/routes/sales.routes.js';
import productionGroupRoutes from './src/routes/productionGroup.routes.js';
import grnRoutes from './src/routes/grn.routes.js';
import deliveryNoteRoutes from './src/routes/deliveryNote.routes.js';
import employeeRoutes from './src/routes/employee.routes.js';
import productRoutes from './src/routes/product.routes.js';
import categoryRoutes from './src/routes/category.routes.js';
import inventoryRoutes from './src/routes/inventory.routes.js';
import warehouseRoutes from './src/routes/warehouse.routes.js';
import companyRoutes from './src/routes/company.routes.js';
import departmentRoutes from './src/routes/department.routes.js';
import attendanceRoutes from './src/routes/attendance.routes.js';
import leaveRoutes from './src/routes/leave.routes.js';
import userRoutes from './src/routes/user.routes.js';
import roleRoutes from './src/routes/role.routes.js';
import factoryRoutes from './src/routes/factory.routes.js';
import supplierRoutes from './src/routes/supplier.routes.js';
import purchaseOrderRoutes from './src/routes/purchaseOrder.routes.js';
import purchaseRequisitionRoutes from './src/routes/purchaseRequisition.routes.js';
import weighbridgeRoutes from './src/routes/weighbridge.routes.js';
import qualityInspectionRoutes from './src/routes/qualityInspection.routes.js';
import rawMaterialRoutes from './src/routes/rawMaterial.routes.js';
import salesOrderRoutes from './src/routes/salesOrder.routes.js';
import productionRoutes from './src/routes/production.routes.js';
import productionPlanRoutes from './src/routes/productionPlan.routes.js';
import procurementPlanRoutes from './src/routes/procurementPlan.routes.js';
import outletRoutes from './src/routes/outlet.routes.js';
import recipeRoutes from './src/routes/recipe.routes.js';
import qualityRoutes from './src/routes/quality.routes.js';
import maintenanceRoutes from './src/routes/maintenance.routes.js';
import logisticsRoutes from './src/routes/logistics.routes.js';
import financeRoutes from './src/routes/finance.routes.js';
import financialPlanRoutes from './src/routes/financialPlan.routes.js';
import crmRoutes from './src/routes/crm.routes.js';
import workflowRoutes from './src/routes/workflow.routes.js';
import reportsRoutes from './src/routes/reports.routes.js';
import backupRoutes from './src/routes/backup.routes.js';
import expenseRoutes from './src/routes/expense.routes.js';
import fleetRoutes from './src/routes/fleet.routes.js';
import sourcingRoutes from './src/routes/sourcing.routes.js';
import pool from './src/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/uploads', express.static(uploadDir));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const PORT = 4000;

const apiRouter = express.Router();

// Public health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('Health check DB error:', err);
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// Apply auth to all api routes
apiRouter.use(authenticateToken);

apiRouter.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  const url = `/api/uploads/${req.file.filename}`;
  res.json({ url });
});

// Mount all routes on apiRouter
apiRouter.use('/companies', companyRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/roles', roleRoutes);
apiRouter.use('/factories', factoryRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/departments', departmentRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/leaves', leaveRoutes);

// Grouped Modules
apiRouter.use('/procurement', procurementRoutes);
apiRouter.use('/sales', salesRoutes);
apiRouter.use('/production', productionGroupRoutes);
apiRouter.use('/inventory', inventoryRoutes);

// Direct / Legacy aliases for fetchCollection compatibility
apiRouter.use('/reports', reportsRoutes);
apiRouter.use('/companies', companyRoutes);
apiRouter.use('/purchaseRequisitions', purchaseRequisitionRoutes);
apiRouter.use('/weighbridge', weighbridgeRoutes);
apiRouter.use('/qualityInspections', qualityInspectionRoutes);
apiRouter.use('/suppliers', supplierRoutes);
apiRouter.use('/purchaseOrders', purchaseOrderRoutes);
apiRouter.use('/rawMaterials', rawMaterialRoutes);
apiRouter.use('/salesOrders', salesOrderRoutes);
apiRouter.use('/warehouses', warehouseRoutes);
apiRouter.use('/outlets', outletRoutes);
apiRouter.use('/inventoryItems', inventoryRoutes);
apiRouter.use('/productionRuns', productionRoutes);
apiRouter.use('/productionPlans', productionPlanRoutes);
apiRouter.use('/procurementPlans', procurementPlanRoutes);
apiRouter.use('/recipes', recipeRoutes);
apiRouter.use('/sourcing', sourcingRoutes);
apiRouter.use('/quality', qualityRoutes);
apiRouter.use('/workflowTemplates', workflowRoutes);

apiRouter.use('/grns', grnRoutes);
apiRouter.use('/deliveryNotes', deliveryNoteRoutes);
apiRouter.use('/maintenance', maintenanceRoutes);
apiRouter.use('/logistics', logisticsRoutes);
apiRouter.use('/finance', financeRoutes);
apiRouter.use('/plans/financial', financialPlanRoutes);
apiRouter.use('/crm', crmRoutes);
apiRouter.use('/reports', reportsRoutes);
apiRouter.use('/backup', backupRoutes);
apiRouter.use('/expenses', expenseRoutes);
apiRouter.use('/fleet', fleetRoutes);

// Mount apiRouter on /api
app.use('/api', apiRouter);

// Catch-all for API 404s
apiRouter.use((req, res) => {
  console.log(`API 404 at backend: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'API route not found at backend' });
});

app.get('/', (req, res) => {
  res.send('Backend API Server running.');
});

import { initDb } from './src/schema.js';

initDb();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
