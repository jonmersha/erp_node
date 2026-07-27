import express from 'express';
import pool from '../../../config/db.config.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', async (req, res) => {
  const { companyId } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
  try {
    const [rows] = await pool.query(
      'SELECT id, company_id as companyId, year, quarter, target_revenue as targetRevenue, target_expense as targetExpense, status, created_by as createdBy, approved_by as approvedBy FROM financial_plans WHERE company_id = ? ORDER BY year DESC, quarter DESC',
      [companyId]
    );
    res.json(rows);
  } catch (error) {
    console.error("financialPlans GET Error:", error);
    res.status(500).json({ error: 'Failed to fetch financial plans', details: error.message });
  }
});

router.post('/', async (req, res) => {
  const { companyId, year, quarter, targetRevenue, targetExpense, createdBy, status } = req.body;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
  const id = uuidv4();
  try {
    await pool.query(
      'INSERT INTO financial_plans (id, company_id, year, quarter, target_revenue, target_expense, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, companyId, year, quarter, targetRevenue, targetExpense, status || 'draft', createdBy || null]
    );
    res.status(201).json({ id, companyId, year, quarter, targetRevenue, targetExpense, status: status || 'draft' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add financial plan' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { targetRevenue, targetExpense, status } = req.body;
  try {
    await pool.query('UPDATE financial_plans SET target_revenue = ?, target_expense = ?, status = COALESCE(?, status) WHERE id = ?', [targetRevenue, targetExpense, status, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update financial plan' });
  }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId } = req.body;
    const [plans] = await pool.query('SELECT created_by FROM financial_plans WHERE id = ?', [id]);
    if (plans.length === 0) return res.status(404).json({ error: 'Plan not found' });
    if (plans[0].created_by === approverId) {
      return res.status(403).json({ error: 'Maker cannot be the checker. You cannot approve this plan.' });
    }
    await pool.query('UPDATE financial_plans SET status = ?, approved_by = ? WHERE id = ?', ['approved', approverId, id]);
    res.json({ message: 'Plan approved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve plan' });
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId } = req.body;
    const [plans] = await pool.query('SELECT created_by FROM financial_plans WHERE id = ?', [id]);
    if (plans.length === 0) return res.status(404).json({ error: 'Plan not found' });
    if (plans[0].created_by === approverId) {
      return res.status(403).json({ error: 'Maker cannot be the checker. You cannot reject this plan.' });
    }
    await pool.query('UPDATE financial_plans SET status = ?, approved_by = ? WHERE id = ?', ['rejected', approverId, id]);
    res.json({ message: 'Plan rejected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject plan' });
  }
});

export default router;
