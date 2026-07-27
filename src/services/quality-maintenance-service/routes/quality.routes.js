import { Router } from 'express';
import { 
  getAllQualityChecks, createQualityCheck, updateQualityCheck, deleteQualityCheck,
  getQualityChecklists, createQualityChecklist, updateQualityChecklist, deleteQualityChecklist,
  getNCRs, updateNCR
} from '../controllers/quality.controller.js';

const router = Router();

// Quality Checklists
router.get('/checklists', getQualityChecklists);
router.post('/checklists', createQualityChecklist);
router.put('/checklists/:id', updateQualityChecklist);
router.delete('/checklists/:id', deleteQualityChecklist);

// Non-Conformance Reports (NCRs)
router.get('/ncrs', getNCRs);
router.put('/ncrs/:id', updateNCR);

// Quality Checks (General)
router.get('/', getAllQualityChecks);
router.post('/', createQualityCheck);
router.put('/:id', updateQualityCheck);
router.delete('/:id', deleteQualityCheck);

export default router;
