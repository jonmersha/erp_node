import express from 'express';
import pool from '../../../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', async (req, res) => {
  const { companyId } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
  try {
    const [rows] = await pool.query(
      'SELECT id, company_id as companyId, year, quarter, target_revenue as targetRevenue, target_expense as targetExpense FROM financial_plans WHERE company_id = ? ORDER BY year DESC, quarter DESC',
      [companyId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch financial plans' });
  }
});

router.post('/', async (req, res) => {
  const { companyId, year, quarter, targetRevenue, targetExpense } = req.body;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
  const id = uuidv4();
  try {
    await pool.query(
      'INSERT INTO financial_plans (id, company_id, year, quarter, target_revenue, target_expense) VALUES (?, ?, ?, ?, ?, ?)',
      [id, companyId, year, quarter, targetRevenue, targetExpense]
    );
    res.status(201).json({ id, companyId, year, quarter, targetRevenue, targetExpense });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add financial plan' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { targetRevenue, targetExpense } = req.body;
  try {
    await pool.query('UPDATE financial_plans SET target_revenue = ?, target_expense = ? WHERE id = ?', [targetRevenue, targetExpense, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update financial plan' });
  }
});

export default router;
