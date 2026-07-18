import { Router } from 'express';
import { 
  getAllProcurementPlans, 
  createProcurementPlan, 
  updateProcurementPlan, 
  deleteProcurementPlan 
} from '../controllers/procurementPlan.controller.js';

const router = Router();
router.get('/', getAllProcurementPlans);
router.post('/', createProcurementPlan);
router.put('/:id', updateProcurementPlan);
router.delete('/:id', deleteProcurementPlan);

export default router;
