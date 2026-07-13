import { Router } from 'express';
import { getAllCompanies, getCompany, createCompany, updateCompany, deleteCompany } from '../controllers/company.controller.js';

const router = Router();

router.get('/', getAllCompanies);
router.get('/:id', getCompany);
router.post('/', createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

export default router;
