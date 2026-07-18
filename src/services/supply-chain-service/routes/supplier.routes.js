import { Router } from 'express';
import { getAllSuppliers, createSupplier, updateSupplier, deleteSupplier, approveSupplier } from '../controllers/supplier.controller.js';

const router = Router();

router.get('/', getAllSuppliers);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.put('/:id/approve', approveSupplier);
router.delete('/:id', deleteSupplier);

export default router;
