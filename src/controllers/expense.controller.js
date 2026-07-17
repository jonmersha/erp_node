import pool from '../db.js';
import crypto from 'node:crypto';

// --- Cost Centers ---

export const getCostCenters = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'Company ID required' });

    const [rows] = await pool.query('SELECT * FROM cost_centers WHERE company_id = ?', [companyId]);
    const mapped = rows.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description,
      managerId: r.manager_id,
      companyId: r.company_id,
      createdAt: r.created_at
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCostCenter = async (req, res) => {
  try {
    const { name, code, description, managerId, companyId } = req.body;
    const id = crypto.randomUUID();

    await pool.query(
      'INSERT INTO cost_centers (id, name, code, description, manager_id, company_id) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, code, description, managerId, companyId]
    );
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Budgets ---

export const getBudgets = async (req, res) => {
  try {
    const { companyId, year } = req.query;
    if (!companyId) return res.status(400).json({ error: 'Company ID required' });

    let query = 'SELECT b.*, c.name as cost_center_name FROM budgets b JOIN cost_centers c ON b.cost_center_id = c.id WHERE b.company_id = ?';
    const params = [companyId];
    if (year) {
      query += ' AND b.fiscal_year = ?';
      params.push(year);
    }
    
    const [rows] = await pool.query(query, params);
    const mapped = rows.map(r => ({
      id: r.id,
      costCenterId: r.cost_center_id,
      costCenterName: r.cost_center_name,
      fiscalYear: r.fiscal_year,
      totalAmount: parseFloat(r.total_amount),
      companyId: r.company_id,
      createdAt: r.created_at
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBudget = async (req, res) => {
  try {
    const { costCenterId, fiscalYear, totalAmount, companyId } = req.body;
    const id = crypto.randomUUID();

    await pool.query(
      'INSERT INTO budgets (id, cost_center_id, fiscal_year, total_amount, company_id) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE total_amount = ?',
      [id, costCenterId, fiscalYear, totalAmount, companyId, totalAmount]
    );
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Expenses ---

export const getExpenses = async (req, res) => {
  try {
    const { companyId, costCenterId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'Company ID required' });

    let query = 'SELECT e.*, c.name as cost_center_name FROM expenses e JOIN cost_centers c ON e.cost_center_id = c.id WHERE e.company_id = ? ORDER BY e.date DESC';
    const params = [companyId];
    
    if (costCenterId) {
      query = 'SELECT e.*, c.name as cost_center_name FROM expenses e JOIN cost_centers c ON e.cost_center_id = c.id WHERE e.company_id = ? AND e.cost_center_id = ? ORDER BY e.date DESC';
      params.push(costCenterId);
    }

    const [rows] = await pool.query(query, params);
    const mapped = rows.map(r => ({
      id: r.id,
      costCenterId: r.cost_center_id,
      costCenterName: r.cost_center_name,
      amount: parseFloat(r.amount),
      date: r.date,
      description: r.description,
      category: r.category,
      status: r.status,
      companyId: r.company_id,
      createdBy: r.created_by,
      approvedBy: r.approved_by,
      createdAt: r.created_at
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const { costCenterId, amount, date, description, category, companyId, createdBy } = req.body;
    const id = crypto.randomUUID();

    await pool.query(
      'INSERT INTO expenses (id, cost_center_id, amount, date, description, category, status, company_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, costCenterId, amount, date, description, category, 'pending', companyId, createdBy]
    );
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveExpense = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { approverId } = req.body;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [expenses] = await connection.query('SELECT * FROM expenses WHERE id = ?', [id]);
    if (expenses.length === 0) throw new Error('Expense not found');
    const expense = expenses[0];

    if (expense.status !== 'pending') throw new Error('Expense is not in pending status');
    if (expense.created_by === approverId) throw new Error('Maker cannot be the checker. You cannot approve your own expense.');

    await connection.query(
      'UPDATE expenses SET status = ?, approved_by = ? WHERE id = ?',
      ['approved', approverId, id]
    );
    
    // Optionally insert into journal_entries here if the user wanted it
    // But per instructions, only if requested (user asked to add standard functionality). Let's wait.

    await connection.commit();
    res.json({ message: 'Expense approved successfully' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const updateCostCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, managerId } = req.body;
    await pool.query(
      'UPDATE cost_centers SET name = ?, code = ?, description = ?, manager_id = ? WHERE id = ?',
      [name, code, description, managerId, id]
    );
    res.json({ message: 'Cost center updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { costCenterId, fiscalYear, totalAmount } = req.body;
    await pool.query(
      'UPDATE budgets SET cost_center_id = ?, fiscal_year = ?, total_amount = ? WHERE id = ?',
      [costCenterId, fiscalYear, totalAmount, id]
    );
    res.json({ message: 'Budget updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { costCenterId, amount, date, description, category } = req.body;
    
    const [rows] = await pool.query('SELECT status FROM expenses WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    if (rows[0].status !== 'pending') return res.status(400).json({ error: 'Can only edit pending expenses' });

    await pool.query(
      'UPDATE expenses SET cost_center_id = ?, amount = ?, date = ?, description = ?, category = ? WHERE id = ?',
      [costCenterId, amount, date, description, category, id]
    );
    res.json({ message: 'Expense updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
