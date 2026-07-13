import { Router } from 'express';
import { getInventory, createInventory, updateInventory, deleteInventory } from '../controllers/inventory.controller.js';

const router = Router();

router.get('/', getInventory);
router.post('/', createInventory);
router.put('/:id', updateInventory);
router.delete('/:id', deleteInventory);

export default router;
