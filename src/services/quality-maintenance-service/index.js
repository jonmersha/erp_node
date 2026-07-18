import { Router } from 'express';

const router = Router();

import qualityRoutes from './routes/quality.routes.js';
router.use('/quality', qualityRoutes);
import qualityInspectionRoutes from './routes/qualityInspection.routes.js';
router.use('/qualityInspection', qualityInspectionRoutes);
import maintenanceRoutes from './routes/maintenance.routes.js';
router.use('/maintenance', maintenanceRoutes);
import fleetRoutes from './routes/fleet.routes.js';
router.use('/fleet', fleetRoutes);

export default router;
