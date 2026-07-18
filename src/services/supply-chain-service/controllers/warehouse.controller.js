import pool from '../../../db.js';
import crypto from 'node:crypto';

export const getAllWarehouses = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM warehouses';
    let params = [];
    if (companyId) {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    const [rows] = await pool.query(query, params);
    
    const mappedRows = rows.map(row => ({
      ...row,
      companyId: row.company_id,
      factoryId: row.factory_id,
      managerId: row.manager_id
    }));
    res.json(mappedRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
};

export const createWarehouse = async (req, res) => {
  try {
    const { id, name, location, factory_id, factoryId, company_id, companyId, manager_id, managerId } = req.body;
    const warehouseId = id || crypto.randomUUID();
    const finalFactoryId = factory_id || factoryId || null;
    const finalCompanyId = company_id || companyId;
    const finalManagerId = manager_id || managerId || null;
    await pool.query(
      'INSERT INTO warehouses (id, name, location, factory_id, company_id, manager_id) VALUES (?, ?, ?, ?, ?, ?)',
      [warehouseId, name, location, finalFactoryId, finalCompanyId, finalManagerId]
    );
    res.status(201).json({ id: warehouseId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
};

export const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, factory_id, factoryId, manager_id, managerId } = req.body;
    const finalFactoryId = factory_id || factoryId || null;
    const finalManagerId = manager_id || managerId || null;
    await pool.query(
      'UPDATE warehouses SET name = ?, location = ?, factory_id = ?, manager_id = ? WHERE id = ?',
      [name, location, finalFactoryId, finalManagerId, id]
    );
    res.json({ message: 'Warehouse updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM warehouses WHERE id = ?', [id]);
    res.json({ message: 'Warehouse deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete warehouse' });
  }
};
