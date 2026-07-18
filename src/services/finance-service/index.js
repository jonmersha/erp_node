import { Router } from 'express';

const router = Router();

import financeRoutes from './routes/finance.routes.js';
router.use('/finance', financeRoutes);
import financialPlanRoutes from './routes/financialPlan.routes.js';
router.use('/financialPlan', financialPlanRoutes);
import expenseRoutes from './routes/expense.routes.js';
router.use('/expense', expenseRoutes);

export default router;
