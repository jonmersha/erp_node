import { Router } from 'express';
import multer from 'multer';
import { getAllRawMaterials, createRawMaterial, updateRawMaterial, deleteRawMaterial, downloadTemplate, uploadRawMaterials } from '../controllers/rawMaterial.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/template', downloadTemplate);
router.post('/upload', upload.single('file'), uploadRawMaterials);
router.get('/', getAllRawMaterials);
router.post('/', createRawMaterial);
router.put('/:id', updateRawMaterial);
router.delete('/:id', deleteRawMaterial);

export default router;
