import { Router } from 'express';
import productionRoutes from './production.routes.js';
import productionPlanRoutes from './productionPlan.routes.js';
import recipeRoutes from './recipe.routes.js';

const router = Router();

router.use('/runs', productionRoutes);
router.use('/plans', productionPlanRoutes);
router.use('/recipes', recipeRoutes);
router.use('/', productionRoutes);

export default router;
