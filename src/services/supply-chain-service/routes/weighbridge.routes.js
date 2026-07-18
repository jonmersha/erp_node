import express from 'express';
import { getWeighbridgeLogs, createWeighbridgeLog, updateWeighbridgeLogOut } from '../controllers/weighbridge.controller.js';
import { authenticateToken } from '../../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getWeighbridgeLogs);
router.post('/', createWeighbridgeLog);
router.put('/:id/out', updateWeighbridgeLogOut);

export default router;
