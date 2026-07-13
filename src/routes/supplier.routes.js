import { Router } from 'express';
import { getAllSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplier.controller.js';

const router = Router();

router.get('/', getAllSuppliers);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
