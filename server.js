import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from './src/middleware/auth.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import procurementRoutes from './src/services/supply-chain-service/routes/procurement.routes.js';
import salesRoutes from './src/services/sales-service/routes/sales.routes.js';
import productionGroupRoutes from './src/services/manufacturing-service/routes/productionGroup.routes.js';
import grnRoutes from './src/services/supply-chain-service/routes/grn.routes.js';
import deliveryNoteRoutes from './src/services/supply-chain-service/routes/deliveryNote.routes.js';
import employeeRoutes from './src/services/hr-service/routes/employee.routes.js';
import productRoutes from './src/services/master-data-service/routes/product.routes.js';
import categoryRoutes from './src/services/master-data-service/routes/category.routes.js';
import inventoryRoutes from './src/services/supply-chain-service/routes/inventory.routes.js';
import warehouseRoutes from './src/services/supply-chain-service/routes/warehouse.routes.js';
import companyRoutes from './src/services/master-data-service/routes/company.routes.js';
import roleRoutes from './src/services/master-data-service/routes/role.routes.js';
import departmentRoutes from './src/services/hr-service/routes/department.routes.js';
import attendanceRoutes from './src/services/hr-service/routes/attendance.routes.js';
import leaveRoutes from './src/services/hr-service/routes/leave.routes.js';
import factoryRoutes from './src/services/master-data-service/routes/factory.routes.js';
import supplierRoutes from './src/services/supply-chain-service/routes/supplier.routes.js';
import purchaseOrderRoutes from './src/services/supply-chain-service/routes/purchaseOrder.routes.js';
import purchaseRequisitionRoutes from './src/services/supply-chain-service/routes/purchaseRequisition.routes.js';
import weighbridgeRoutes from './src/services/supply-chain-service/routes/weighbridge.routes.js';
import qualityInspectionRoutes from './src/services/quality-maintenance-service/routes/qualityInspection.routes.js';
import rawMaterialRoutes from './src/services/supply-chain-service/routes/rawMaterial.routes.js';
import salesOrderRoutes from './src/services/sales-service/routes/salesOrder.routes.js';
import pricingRoutes from './src/services/sales-service/routes/pricing.routes.js';
import productionRoutes from './src/services/manufacturing-service/routes/production.routes.js';
import productionPlanRoutes from './src/services/manufacturing-service/routes/productionPlan.routes.js';
import procurementPlanRoutes from './src/services/supply-chain-service/routes/procurementPlan.routes.js';
import outletRoutes from './src/services/sales-service/routes/outlet.routes.js';
import recipeRoutes from './src/services/manufacturing-service/routes/recipe.routes.js';
import qualityRoutes from './src/services/quality-maintenance-service/routes/quality.routes.js';
import maintenanceRoutes from './src/services/quality-maintenance-service/routes/maintenance.routes.js';
import logisticsRoutes from './src/services/supply-chain-service/routes/logistics.routes.js';
import financeRoutes from './src/services/finance-service/routes/finance.routes.js';
import financialPlanRoutes from './src/services/finance-service/routes/financialPlan.routes.js';
import assetsRoutes from './src/services/finance-service/routes/assets.routes.js';
import crmRoutes from './src/services/sales-service/routes/crm.routes.js';
import workflowRoutes from './src/services/master-data-service/routes/workflow.routes.js';
import reportsRoutes from './src/services/master-data-service/routes/reports.routes.js';
import backupRoutes from './src/services/master-data-service/routes/backup.routes.js';
import expenseRoutes from './src/services/finance-service/routes/expense.routes.js';
import fleetRoutes from './src/services/quality-maintenance-service/routes/fleet.routes.js';
import sourcingRoutes from './src/services/supply-chain-service/routes/sourcing.routes.js';
import pool from './src/config/db.config.js';
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

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use('/api/uploads', express.static(uploadDir));

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}
app.use(express.static(publicDir));

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

const PORT = process.env.PORT || 4000;

const apiRouter = express.Router();

// Apply rate limiting to all API requests (Production only)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
});

if (process.env.NODE_ENV === 'production') {
  apiRouter.use(apiLimiter);
}

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

apiRouter.use('/companies', companyRoutes);
// Auth Routes moved to auth-service
apiRouter.use('/factories', factoryRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/departments', departmentRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/leaves', leaveRoutes);
apiRouter.use('/roles', roleRoutes);

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
apiRouter.use('/pricing', pricingRoutes);
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
apiRouter.use('/assets', assetsRoutes);
apiRouter.use('/plans/financial', financialPlanRoutes);
apiRouter.use('/crm', crmRoutes);
apiRouter.use('/reports', reportsRoutes);
apiRouter.use('/backup', backupRoutes);
apiRouter.use('/expenses', expenseRoutes);
apiRouter.use('/fleet', fleetRoutes);

// Catch-all for API 404s
apiRouter.use((req, res, next) => {
  const error = new Error('API route not found at backend');
  error.statusCode = 404;
  next(error);
});

// Mount apiRouter on /api
app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.send('Backend API Server running.');
});

// Global Error Handler must be the last middleware
app.use(errorHandler);

import { initDb } from './src/config/db.schema.js';

initDb();

async function startServer() {
  try {

    console.log("Starting Milki ERP Backend...");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Port:", process.env.PORT);

    await initDb();

    app.listen(PORT, () => {
      console.log(
        `[Backend] Running on port ${PORT}`
      );
    });

  } catch (error) {

    console.error(
      "Startup failed:",
      error
    );

    process.exit(1);

  }
}

startServer();
