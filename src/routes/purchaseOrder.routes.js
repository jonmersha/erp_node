import { Router } from 'express';
import { getAllPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } from '../controllers/purchaseOrder.controller.js';
import { getAllProcurementPlans, createProcurementPlan, updateProcurementPlan, deleteProcurementPlan } from '../controllers/procurementPlan.controller.js';

const router = Router();

router.get('/plans', getAllProcurementPlans);
router.post('/plans', createProcurementPlan);
router.put('/plans/:id', updateProcurementPlan);
router.delete('/plans/:id', deleteProcurementPlan);

router.get('/', getAllPurchaseOrders);
router.post('/', createPurchaseOrder);
router.put('/:id', updatePurchaseOrder);
router.delete('/:id', deletePurchaseOrder);

export default router;
