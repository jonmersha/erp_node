import pool from '../../../config/db.config.js';
import crypto from 'node:crypto';

export const getAllOutlets = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM sales_outlets';
    let params = [];
    if (companyId) {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    const [rows] = await pool.query(query, params);
    
    // map snake_case to camelCase
    const mappedRows = rows.map(row => ({
      ...row,
      companyId: row.company_id
    }));
    res.json(mappedRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch outlets' });
  }
};

export const createOutlet = async (req, res) => {
  try {
    const { id, name, location, company_id, companyId, factoryId, factory_id } = req.body;
    const outletId = id || crypto.randomUUID();
    const finalCompanyId = company_id || companyId;
    const finalFactoryId = factoryId || factory_id || null;
    await pool.query(
      'INSERT INTO sales_outlets (id, name, location, company_id, factory_id) VALUES (?, ?, ?, ?, ?)',
      [outletId, name, location, finalCompanyId, finalFactoryId]
    );
    res.status(201).json({ id: outletId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create outlet' });
  }
};

export const updateOutlet = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, factoryId, factory_id } = req.body;
    const finalFactoryId = factoryId || factory_id || null;
    await pool.query(
      'UPDATE sales_outlets SET name = ?, location = ?, factory_id = ? WHERE id = ?',
      [name, location, finalFactoryId, id]
    );
    res.json({ message: 'Outlet updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update outlet' });
  }
};

export const deleteOutlet = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM sales_outlets WHERE id = ?', [id]);
    res.json({ message: 'Outlet deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete outlet' });
  }
};
