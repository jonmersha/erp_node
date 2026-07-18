import { Router } from 'express';
import { getAllFactories, createFactory, updateFactory, deleteFactory } from '../controllers/factory.controller.js';

const router = Router();

router.get('/', getAllFactories);
router.post('/', createFactory);
router.put('/:id', updateFactory);
router.delete('/:id', deleteFactory);

export default router;
