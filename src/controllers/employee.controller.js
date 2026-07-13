import pool from '../db.js';
import crypto from 'node:crypto';

export const getAllEmployees = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(400).json({ error: 'User is not associated with a company' });
    }

    const [rows] = await pool.query('SELECT * FROM employees WHERE company_id = ?', [companyId]);
    
    // map snake_case to camelCase
    const mappedRows = rows.map(row => ({
      ...row,
      factoryId: row.factory_id,
      companyId: row.company_id,
      hireDate: row.hire_date
    }));
    
    res.json(mappedRows);
  } catch (error) {
    console.error('Fetch employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const { name, email, department, role, salary, factoryId, hireDate } = req.body;
    const companyId = req.user?.company_id;

    if (!companyId) {
      return res.status(400).json({ error: 'User is not associated with a company' });
    }

    const id = crypto.randomUUID();
    const formattedHireDate = hireDate ? new Date(hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    await pool.query(
      'INSERT INTO employees (id, name, email, department, role, salary, factory_id, hire_date, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, department, role, salary, factoryId, formattedHireDate, companyId]
    );
    res.status(201).json({ id });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, role, salary, factoryId, hireDate } = req.body;
    const companyId = req.user?.company_id;

    if (!companyId) {
      return res.status(400).json({ error: 'User is not associated with a company' });
    }

    const formattedHireDate = hireDate ? new Date(hireDate).toISOString().split('T')[0] : null;

    const [result] = await pool.query(
      'UPDATE employees SET name = ?, email = ?, department = ?, role = ?, salary = ?, factory_id = ?, hire_date = ? WHERE id = ? AND company_id = ?',
      [name, email, department, role, salary, factoryId, formattedHireDate, id, companyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found or unauthorized' });
    }

    res.json({ message: 'Employee updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.company_id;

    if (!companyId) {
      return res.status(400).json({ error: 'User is not associated with a company' });
    }

    const [result] = await pool.query('DELETE FROM employees WHERE id = ? AND company_id = ?', [id, companyId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found or unauthorized' });
    }

    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};
