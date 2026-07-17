import express from 'express';
import { getQualityInspections, createQualityInspection } from '../controllers/qualityInspection.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getQualityInspections);
router.post('/', createQualityInspection);

export default router;
