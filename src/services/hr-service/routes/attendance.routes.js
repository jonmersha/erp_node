import { Router } from 'express';
import { getAttendance, logAttendance } from '../controllers/attendance.controller.js';

const router = Router();

router.get('/', getAttendance);
router.post('/', logAttendance);

export default router;
