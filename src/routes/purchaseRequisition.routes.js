import express from 'express';
import { 
  getPurchaseRequisitions, 
  createPurchaseRequisition, 
  approvePurchaseRequisition, 
  rejectPurchaseRequisition 
} from '../controllers/purchaseRequisition.controller.js';

const router = express.Router();

router.get('/', getPurchaseRequisitions);
router.post('/', createPurchaseRequisition);
router.put('/:id/approve', approvePurchaseRequisition);
router.put('/:id/reject', rejectPurchaseRequisition);

export default router;
