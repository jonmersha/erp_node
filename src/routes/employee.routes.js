import { Router } from 'express';
import multer from 'multer';
import { getAllEmployees, createEmployee, updateEmployee, deleteEmployee, downloadTemplate, uploadEmployees } from '../controllers/employee.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/template', downloadTemplate);
router.post('/upload', upload.single('file'), uploadEmployees);
router.get('/', getAllEmployees);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;
