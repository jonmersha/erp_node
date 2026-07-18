import { Router } from 'express';
import salesOrderRoutes from './salesOrder.routes.js';
import outletRoutes from './outlet.routes.js';

const router = Router();

router.use('/orders', salesOrderRoutes);
router.use('/outlets', outletRoutes);
router.use('/', salesOrderRoutes);

export default router;
