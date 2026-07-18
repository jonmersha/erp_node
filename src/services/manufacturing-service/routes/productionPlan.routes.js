import { Router } from 'express';
import { getAllProductionPlans } from '../controllers/productionPlan.controller.js';

const router = Router();
router.get('/', getAllProductionPlans);

export default router;
