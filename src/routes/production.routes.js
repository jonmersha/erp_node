import { Router } from 'express';
import { getAllProductionRuns, createProductionRun, updateProductionRun, deleteProductionRun } from '../controllers/production.controller.js';
import { getAllProductionPlans, createProductionPlan, updateProductionPlan, deleteProductionPlan } from '../controllers/productionPlan.controller.js';

const router = Router();

router.get('/plans', getAllProductionPlans);
router.post('/plans', createProductionPlan);
router.put('/plans/:id', updateProductionPlan);
router.delete('/plans/:id', deleteProductionPlan);

router.get('/', getAllProductionRuns);
router.post('/', createProductionRun);
router.put('/:id', updateProductionRun);
router.delete('/:id', deleteProductionRun);

export default router;
