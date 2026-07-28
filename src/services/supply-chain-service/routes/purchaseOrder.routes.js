import { Router } from 'express';
import { getAllPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, approvePurchaseOrder, rejectPurchaseOrder, submitPurchaseOrder } from '../controllers/purchaseOrder.controller.js';
import { getAllProcurementPlans, createProcurementPlan, updateProcurementPlan, deleteProcurementPlan, approveProcurementPlan, rejectProcurementPlan } from '../controllers/procurementPlan.controller.js';
import { getPOLifecycle } from '../controllers/poLifecycle.controller.js';

const router = Router();

router.get('/plans', getAllProcurementPlans);
router.post('/plans', createProcurementPlan);
router.put('/plans/:id', updateProcurementPlan);
router.post('/plans/:id/approve', approveProcurementPlan);
router.post('/plans/:id/reject', rejectProcurementPlan);
router.delete('/plans/:id', deleteProcurementPlan);

router.get('/:id/lifecycle', getPOLifecycle);

router.get('/', getAllPurchaseOrders);
router.post('/', createPurchaseOrder);
router.put('/:id', updatePurchaseOrder);
router.post('/:id/submit', submitPurchaseOrder);
router.post('/:id/approve', approvePurchaseOrder);
router.post('/:id/reject', rejectPurchaseOrder);
router.delete('/:id', deletePurchaseOrder);

export default router;
