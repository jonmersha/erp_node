import { Router } from 'express';
import { getInventory, createInventory, updateInventory, deleteInventory, receivePurchaseOrder, shipSalesOrder, transferProduction, getBatchTraceability } from '../controllers/inventory.controller.js';

const router = Router();

router.get('/', getInventory);
router.get('/traceability/:batchNumber', getBatchTraceability);
router.post('/', createInventory);
router.post('/receive-po', receivePurchaseOrder);
router.post('/ship-order', shipSalesOrder);
router.post('/transfer-production', transferProduction);
router.put('/:id', updateInventory);
router.delete('/:id', deleteInventory);

export default router;
