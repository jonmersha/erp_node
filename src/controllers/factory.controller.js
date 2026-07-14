import pool from '../db.js';
import crypto from 'node:crypto';

export const getAllFactories = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM factories';
    let params = [];
    if (companyId) {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    const [rows] = await pool.query(query, params);
    
    const mappedRows = rows.map(row => ({
      ...row,
      companyId: row.company_id,
      managerId: row.manager_id
    }));
    res.json(mappedRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch factories' });
  }
};

export const createFactory = async (req, res) => {
  try {
    const { id, name, location, company_id, companyId, manager_id, managerId } = req.body;
    const factoryId = id || crypto.randomUUID();
    const finalCompanyId = company_id || companyId;
    const finalManagerId = manager_id || managerId || null;
    await pool.query(
      'INSERT INTO factories (id, name, location, company_id, manager_id) VALUES (?, ?, ?, ?, ?)',
      [factoryId, name, location, finalCompanyId, finalManagerId]
    );
    res.status(201).json({ id: factoryId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create factory' });
  }
};

export const updateFactory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, manager_id, managerId } = req.body;
    const finalManagerId = manager_id || managerId || null;
    await pool.query(
      'UPDATE factories SET name = ?, location = ?, manager_id = ? WHERE id = ?',
      [name, location, finalManagerId, id]
    );
    res.json({ message: 'Factory updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update factory' });
  }
};

export const deleteFactory = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM factories WHERE id = ?', [id]);
    res.json({ message: 'Factory deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete factory' });
  }
};
