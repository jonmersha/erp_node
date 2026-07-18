import { Router } from 'express';
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/department.controller.js';

const router = Router();

router.get('/', getAllDepartments);
router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);

export default router;
