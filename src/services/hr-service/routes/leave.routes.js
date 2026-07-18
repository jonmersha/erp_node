import { Router } from 'express';
import { getLeaves, applyLeave, updateLeaveStatus } from '../controllers/leave.controller.js';

const router = Router();

router.get('/', getLeaves);
router.post('/', applyLeave);
router.put('/:id/status', updateLeaveStatus);

export default router;
