import { Router } from 'express';
import { getAllRawMaterials, createRawMaterial, updateRawMaterial, deleteRawMaterial } from '../controllers/rawMaterial.controller.js';

const router = Router();

router.get('/', getAllRawMaterials);
router.post('/', createRawMaterial);
router.put('/:id', updateRawMaterial);
router.delete('/:id', deleteRawMaterial);

export default router;
