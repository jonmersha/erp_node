import { Router } from 'express';
import { getAllSalesOrders, createSalesOrder, updateSalesOrder, deleteSalesOrder } from '../controllers/salesOrder.controller.js';
import { getAllSalesPlans, createSalesPlan, updateSalesPlan, deleteSalesPlan } from '../controllers/salesPlan.controller.js';

const router = Router();

router.get('/plans', getAllSalesPlans);
router.post('/plans', createSalesPlan);
router.put('/plans/:id', updateSalesPlan);
router.delete('/plans/:id', deleteSalesPlan);

router.get('/', getAllSalesOrders);
router.post('/', createSalesOrder);
router.put('/:id', updateSalesOrder);
router.delete('/:id', deleteSalesOrder);

export default router;
