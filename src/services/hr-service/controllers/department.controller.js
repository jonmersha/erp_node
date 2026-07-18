import pool from '../../../db.js';
import crypto from 'node:crypto';

export const getAllDepartments = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(400).json({ error: 'Company ID required' });

    // Join with employees to get manager_name and parent_department_name
    const query = `
      SELECT d.*, m.name as manager_name, pd.name as parent_department_name
      FROM departments d
      LEFT JOIN employees m ON d.manager_id = m.id
      LEFT JOIN departments pd ON d.parent_department_id = pd.id
      WHERE d.company_id = ?
    `;
    const [rows] = await pool.query(query, [companyId]);
    
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      parentDepartmentId: row.parent_department_id,
      managerId: row.manager_id,
      companyId: row.company_id,
      managerName: row.manager_name,
      parentDepartmentName: row.parent_department_name
    }));

    res.json(mappedRows);
  } catch (error) {
    console.error('Fetch departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, description, parentDepartmentId, managerId } = req.body;
    const companyId = req.user?.company_id;

    if (!companyId) return res.status(400).json({ error: 'Company ID required' });

    const id = crypto.randomUUID();
    
    await pool.query(
      'INSERT INTO departments (id, name, description, parent_department_id, manager_id, company_id) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, description, parentDepartmentId || null, managerId || null, companyId]
    );
    res.status(201).json({ id });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentDepartmentId, managerId } = req.body;
    const companyId = req.user?.company_id;

    if (!companyId) return res.status(400).json({ error: 'Company ID required' });

    // Prevent circular reference (a department cannot be its own parent)
    if (id === parentDepartmentId) {
      return res.status(400).json({ error: 'Department cannot be its own parent' });
    }

    const [result] = await pool.query(
      'UPDATE departments SET name = ?, description = ?, parent_department_id = ?, manager_id = ? WHERE id = ? AND company_id = ?',
      [name, description, parentDepartmentId || null, managerId || null, id, companyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ message: 'Department updated' });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.company_id;

    if (!companyId) return res.status(400).json({ error: 'Company ID required' });

    const [result] = await pool.query('DELETE FROM departments WHERE id = ? AND company_id = ?', [id, companyId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ message: 'Department deleted' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};
