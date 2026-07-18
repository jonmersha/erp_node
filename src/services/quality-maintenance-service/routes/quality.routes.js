import { Router } from 'express';
import { getAllQualityChecks, createQualityCheck, updateQualityCheck, deleteQualityCheck } from '../controllers/quality.controller.js';

const router = Router();

router.get('/', getAllQualityChecks);
router.post('/', createQualityCheck);
router.put('/:id', updateQualityCheck);
router.delete('/:id', deleteQualityCheck);

export default router;
