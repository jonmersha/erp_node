import express from 'express';
import { 
  getCostCenters, createCostCenter, updateCostCenter,
  getBudgets, createBudget, updateBudget,
  getExpenses, createExpense, updateExpense, approveExpense
} from '../controllers/expense.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/cost-centers', getCostCenters);
router.post('/cost-centers', createCostCenter);
router.put('/cost-centers/:id', updateCostCenter);

router.get('/budgets', getBudgets);
router.post('/budgets', createBudget);
router.put('/budgets/:id', updateBudget);

router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.post('/expenses/:id/approve', approveExpense);

export default router;
