import { Router } from 'express';
import { 
  getAllSalesPlans, 
  createSalesPlan, 
  updateSalesPlan, 
  deleteSalesPlan, 
  approveSalesPlan, 
  rejectSalesPlan 
} from '../controllers/salesPlan.controller.js';

const router = Router();
router.get('/', getAllSalesPlans);
router.post('/', createSalesPlan);
router.put('/:id', updateSalesPlan);
router.delete('/:id', deleteSalesPlan);
router.post('/:id/approve', approveSalesPlan);
router.post('/:id/reject', rejectSalesPlan);

export default router;
