import express from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/invoices', async (req, res) => {
  const { companyId } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
  try {
    const [rows] = await pool.query(
      'SELECT id, company_id as companyId, order_id as orderId, order_type as orderType, amount, due_date as dueDate, status, created_at as createdAt FROM finance_invoices WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.post('/invoices', async (req, res) => {
  const { companyId, orderId, orderType, amount, dueDate, status } = req.body;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
  const id = uuidv4();
  try {
    await pool.query(
      'INSERT INTO finance_invoices (id, company_id, order_id, order_type, amount, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, companyId, orderId, orderType, amount, dueDate, status || 'draft']
    );
    res.status(201).json({ id, companyId, orderId, orderType, amount, dueDate, status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add invoice' });
  }
});

router.put('/invoices/:id', async (req, res) => {
  const { id } = req.params;
  const { status, amount, dueDate } = req.body;
  try {
    await pool.query('UPDATE finance_invoices SET status = ?, amount = ?, due_date = ? WHERE id = ?', [status, amount, dueDate, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

router.get('/payments', async (req, res) => {
  const { companyId } = req.query;
  if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
  try {
    const [rows] = await pool.query(
      'SELECT id, company_id as companyId, invoice_id as invoiceId, amount, payment_date as paymentDate, payment_method as paymentMethod FROM finance_payments WHERE company_id = ? ORDER BY payment_date DESC',
      [companyId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.post('/payments', async (req, res) => {
  const { companyId, invoiceId, amount, paymentDate, paymentMethod } = req.body;
  if (!companyId || !invoiceId) return res.status(400).json({ error: 'Company ID and Invoice ID are required' });
  const id = uuidv4();
  try {
    await pool.query(
      'INSERT INTO finance_payments (id, company_id, invoice_id, amount, payment_date, payment_method) VALUES (?, ?, ?, ?, ?, ?)',
      [id, companyId, invoiceId, amount, paymentDate, paymentMethod]
    );
    res.status(201).json({ id, companyId, invoiceId, amount, paymentDate, paymentMethod });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add payment' });
  }
});

export default router;
