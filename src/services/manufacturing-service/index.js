import { Router } from 'express';

const router = Router();

import productionRoutes from './routes/production.routes.js';
router.use('/production', productionRoutes);
import productionPlanRoutes from './routes/productionPlan.routes.js';
router.use('/productionPlan', productionPlanRoutes);
import productionGroupRoutes from './routes/productionGroup.routes.js';
router.use('/productionGroup', productionGroupRoutes);
import recipeRoutes from './routes/recipe.routes.js';
router.use('/recipe', recipeRoutes);

export default router;
