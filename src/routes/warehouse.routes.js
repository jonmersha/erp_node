import { Router } from 'express';
import { getAllWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../controllers/warehouse.controller.js';

const router = Router();

router.get('/', getAllWarehouses);
router.post('/', createWarehouse);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);

export default router;
