import { Router } from 'express';
import { getAllGRNs, createGRN } from '../controllers/grn.controller.js';

const router = Router();

router.get('/', getAllGRNs);
router.post('/', createGRN);

export default router;
