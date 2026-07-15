import { Router } from 'express';
import { 
  getAllProductionRuns, 
  createProductionRun, 
  updateProductionRun, 
  deleteProductionRun, 
  getProductionEvents, 
  logProductionEvent, 
  logPackagingSensor,
  getProductionStages,
  updateProductionStage
} from '../controllers/production.controller.js';
import { getAllProductionPlans, createProductionPlan, updateProductionPlan, deleteProductionPlan, approveProductionPlan } from '../controllers/productionPlan.controller.js';

const router = Router();

router.post('/packaging-sensor', logPackagingSensor);

router.get('/plans', getAllProductionPlans);
router.post('/plans', createProductionPlan);
router.put('/plans/:id', updateProductionPlan);
router.put('/plans/:id/approve', approveProductionPlan);
router.delete('/plans/:id', deleteProductionPlan);

router.get('/', getAllProductionRuns);
router.post('/', createProductionRun);
router.put('/:id', updateProductionRun);
router.delete('/:id', deleteProductionRun);

router.get('/:id/events', getProductionEvents);
router.post('/:id/events', logProductionEvent);

router.get('/:id/stages', getProductionStages);
router.put('/:id/stages/:stageId', updateProductionStage);

export default router;
