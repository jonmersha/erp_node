import { Router } from 'express';
import { getAllPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, approvePurchaseOrder } from '../controllers/purchaseOrder.controller.js';
import { getAllProcurementPlans, createProcurementPlan, updateProcurementPlan, deleteProcurementPlan, approveProcurementPlan } from '../controllers/procurementPlan.controller.js';

const router = Router();

router.get('/plans', getAllProcurementPlans);
router.post('/plans', createProcurementPlan);
router.put('/plans/:id', updateProcurementPlan);
router.put('/plans/:id/approve', approveProcurementPlan);
router.delete('/plans/:id', deleteProcurementPlan);

router.get('/', getAllPurchaseOrders);
router.post('/', createPurchaseOrder);
router.put('/:id', updatePurchaseOrder);
router.put('/:id/approve', approvePurchaseOrder);
router.delete('/:id', deletePurchaseOrder);

export default router;
