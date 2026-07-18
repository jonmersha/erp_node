import { Router } from 'express';

const router = Router();

import companyRoutes from './routes/company.routes.js';
router.use('/company', companyRoutes);
import userRoutes from './routes/user.routes.js';
router.use('/user', userRoutes);
import roleRoutes from './routes/role.routes.js';
router.use('/role', roleRoutes);
import factoryRoutes from './routes/factory.routes.js';
router.use('/factory', factoryRoutes);
import categoryRoutes from './routes/category.routes.js';
router.use('/category', categoryRoutes);
import productRoutes from './routes/product.routes.js';
router.use('/product', productRoutes);
import workflowRoutes from './routes/workflow.routes.js';
router.use('/workflow', workflowRoutes);
import reportsRoutes from './routes/reports.routes.js';
router.use('/reports', reportsRoutes);
import backupRoutes from './routes/backup.routes.js';
router.use('/backup', backupRoutes);

export default router;
