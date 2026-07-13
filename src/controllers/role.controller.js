import pool from '../db.js';
import crypto from 'node:crypto';

export const getRoles = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId is required' });

    const [rows] = await pool.query(
      'SELECT id, name, description, is_system, company_id as companyId, created_at, permissions FROM roles WHERE company_id = ? ORDER BY name ASC',
      [companyId]
    );

    // Parse JSON
    const roles = rows.map(r => ({
      ...r,
      is_system: !!r.is_system,
      permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : (r.permissions || {})
    }));
    res.json(roles);
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, description, is_system, companyId, permissions } = req.body;
    
    if (!name || !companyId) {
      return res.status(400).json({ error: 'Name and companyId are required' });
    }

    const id = crypto.randomUUID();
    
    // In MySQL, JSON values must be passed as JSON strings
    const permissionsJson = permissions ? JSON.stringify(permissions) : '{}';

    await pool.query(
      'INSERT INTO roles (id, name, description, is_system, company_id, permissions) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, description || '', is_system || false, companyId, permissionsJson]
    );

    res.status(201).json({ id, name, description, companyId });
  } catch (err) {
    console.error('Error creating role:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A role with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create role' });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    const permissionsJson = permissions ? JSON.stringify(permissions) : '{}';

    const [result] = await pool.query(
      'UPDATE roles SET name = ?, description = ?, permissions = ? WHERE id = ?',
      [name, description || '', permissionsJson, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Role not found' });

    res.json({ id, name, description });
  } catch (err) {
    console.error('Error updating role:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A role with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update role' });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM roles WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Role not found' });

    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error('Error deleting role:', err);
    res.status(500).json({ error: 'Failed to delete role' });
  }
};
