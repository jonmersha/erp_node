import { Router } from 'express';

const router = Router();

import salesRoutes from './routes/sales.routes.js';
router.use('/sales', salesRoutes);
import salesOrderRoutes from './routes/salesOrder.routes.js';
router.use('/salesOrder', salesOrderRoutes);
import outletRoutes from './routes/outlet.routes.js';
router.use('/outlet', outletRoutes);
import crmRoutes from './routes/crm.routes.js';
router.use('/crm', crmRoutes);

export default router;
