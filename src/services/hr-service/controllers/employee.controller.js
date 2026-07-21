import pool from '../../../config/db.config.js';
import crypto from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

export const getAllEmployees = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(400).json({ error: 'User is not associated with a company' });
    }

    const query = `
      SELECT e.*, d.name as department_name, m.name as manager_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employees m ON e.manager_id = m.id
      WHERE e.company_id = ?
    `;
    const [rows] = await pool.query(query, [companyId]);
    
    // map snake_case to camelCase
    const mappedRows = rows.map(row => ({
      ...row,
      factoryId: row.factory_id,
      companyId: row.company_id,
      hireDate: row.hire_date,
      departmentId: row.department_id,
      managerId: row.manager_id,
      departmentName: row.department_name,
      managerName: row.manager_name
    }));
    
    res.json(mappedRows);
  } catch (error) {
    console.error('Fetch employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const { name, email, departmentId, managerId, role, salary, factoryId, hireDate } = req.body;
    const companyId = req.user?.company_id;

    if (!companyId) {
      return res.status(400).json({ error: 'User is not associated with a company' });
    }

    const id = crypto.randomUUID();
    const formattedHireDate = hireDate ? new Date(hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    await pool.query(
      'INSERT INTO employees (id, name, email, department_id, manager_id, role, salary, factory_id, hire_date, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, departmentId || null, managerId || null, role, salary, factoryId, formattedHireDate, companyId]
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
    const { name, email, departmentId, managerId, role, salary, factoryId, hireDate } = req.body;
    const companyId = req.user?.company_id;

    if (!companyId) {
      return res.status(400).json({ error: 'User is not associated with a company' });
    }

    const formattedHireDate = hireDate ? new Date(hireDate).toISOString().split('T')[0] : null;

    const [result] = await pool.query(
      'UPDATE employees SET name = ?, email = ?, department_id = ?, manager_id = ?, role = ?, salary = ?, factory_id = ?, hire_date = ? WHERE id = ? AND company_id = ?',
      [name, email, departmentId || null, managerId || null, role, salary, factoryId, formattedHireDate, id, companyId]
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

export const downloadTemplate = (req, res) => {
  try {
    const columns = ['Name', 'Email', 'Role', 'Department Name', 'Salary', 'Hire Date'];
    const csvData = stringify([columns]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=employees_template.csv');
    res.status(200).send(csvData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate template' });
  }
};

export const uploadEmployees = async (req, res) => {
  try {
    // The previous endpoints used req.body.companyId, but employee route uses req.user.company_id
    // But since the frontend uses FormData, we might send companyId in the body just in case, but let's check req.user too.
    const companyId = req.user?.company_id || req.body.companyId;
    if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
    if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });

    const fileContent = req.file.buffer.toString('utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    let insertedCount = 0;

    // Fetch existing departments to resolve by name
    const [departments] = await pool.query('SELECT id, name FROM departments WHERE company_id = ?', [companyId]);
    const deptMap = {}; 
    departments.forEach(d => {
      deptMap[d.name.toLowerCase()] = d.id;
    });

    for (const row of records) {
      const name = row['Name'];
      const email = row['Email'];
      const role = row['Role'] || 'Employee';
      const deptName = row['Department Name'];
      const salary = parseFloat(row['Salary'] || '0');
      let hireDate = row['Hire Date'];
      
      if (!name || !email) {
        continue;
      }
      
      if (!hireDate) {
        hireDate = new Date().toISOString().split('T')[0];
      }

      let departmentId = null;
      if (deptName) {
        departmentId = deptMap[deptName.toLowerCase()];
        if (!departmentId) {
          // Auto-create department
          departmentId = crypto.randomUUID();
          await pool.query(
            'INSERT INTO departments (id, name, company_id) VALUES (?, ?, ?)',
            [departmentId, deptName, companyId]
          );
          deptMap[deptName.toLowerCase()] = departmentId;
        }
      }

      const id = crypto.randomUUID();
      await pool.query(
        'INSERT INTO employees (id, name, email, department_id, role, salary, hire_date, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, name, email, departmentId, role, salary, hireDate, companyId]
      );
      insertedCount++;
    }

    res.status(200).json({ message: `Successfully uploaded ${insertedCount} employees.` });
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ error: 'Failed to process CSV file', details: error.message });
  }
};
