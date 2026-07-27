import { Router } from 'express';
import { 
  getAllProcurementPlans, 
  createProcurementPlan, 
  updateProcurementPlan, 
  deleteProcurementPlan, 
  approveProcurementPlan,
  rejectProcurementPlan 
} from '../controllers/procurementPlan.controller.js';

const router = Router();
router.get('/', getAllProcurementPlans);
router.post('/', createProcurementPlan);
router.put('/:id', updateProcurementPlan);
router.delete('/:id', deleteProcurementPlan);
router.post('/:id/approve', approveProcurementPlan);
router.post('/:id/reject', rejectProcurementPlan);

export default router;
