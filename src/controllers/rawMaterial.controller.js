import pool from '../db.js';
import crypto from 'node:crypto';

export const getAllRawMaterials = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM raw_materials';
    let params = [];
    if (companyId) {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    const [rows] = await pool.query(query, params);
    
    const mappedRows = rows.map(row => ({
      ...row,
      companyId: row.company_id
    }));
    res.json(mappedRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch raw materials' });
  }
};

export const createRawMaterial = async (req, res) => {
  try {
    const { id, name, unit, company_id, companyId } = req.body;
    const materialId = id || crypto.randomUUID();
    const finalCompanyId = company_id || companyId;
    await pool.query(
      'INSERT INTO raw_materials (id, name, unit, company_id) VALUES (?, ?, ?, ?)',
      [materialId, name, unit, finalCompanyId]
    );
    res.status(201).json({ id: materialId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create raw material' });
  }
};

export const updateRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit } = req.body;
    await pool.query(
      'UPDATE raw_materials SET name = ?, unit = ? WHERE id = ?',
      [name, unit, id]
    );
    res.json({ message: 'Raw material updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update raw material' });
  }
};

export const deleteRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM raw_materials WHERE id = ?', [id]);
    res.json({ message: 'Raw material deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete raw material' });
  }
};
