import { Router } from 'express';

const router = Router();

import employeeRoutes from './routes/employee.routes.js';
router.use('/employee', employeeRoutes);
import attendanceRoutes from './routes/attendance.routes.js';
router.use('/attendance', attendanceRoutes);
import leaveRoutes from './routes/leave.routes.js';
router.use('/leave', leaveRoutes);
import departmentRoutes from './routes/department.routes.js';
router.use('/department', departmentRoutes);

export default router;
