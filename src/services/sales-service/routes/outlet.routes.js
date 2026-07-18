import { Router } from 'express';
import { getAllOutlets, createOutlet, updateOutlet, deleteOutlet } from '../controllers/outlet.controller.js';

const router = Router();

router.get('/', getAllOutlets);
router.post('/', createOutlet);
router.put('/:id', updateOutlet);
router.delete('/:id', deleteOutlet);

export default router;
