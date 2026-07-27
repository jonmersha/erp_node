import { Router } from 'express';
import { 
  getAllProductionPlans, 
  createProductionPlan, 
  updateProductionPlan, 
  deleteProductionPlan, 
  approveProductionPlan, 
  rejectProductionPlan 
} from '../controllers/productionPlan.controller.js';

const router = Router();
router.get('/', getAllProductionPlans);
router.post('/', createProductionPlan);
router.put('/:id', updateProductionPlan);
router.delete('/:id', deleteProductionPlan);
router.post('/:id/approve', approveProductionPlan);
router.post('/:id/reject', rejectProductionPlan);

export default router;
