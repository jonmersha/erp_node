import pool from '../db.js';
import crypto from 'node:crypto';

export const getAllSuppliers = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM suppliers';
    let params = [];
    if (companyId) {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    const [rows] = await pool.query(query, params);
    res.json(rows.map(row => ({ ...row, companyId: row.company_id })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const { id, name, contact, email, company_id, companyId } = req.body;
    console.log('Attempting to create supplier:', { name, companyId: company_id || companyId });
    
    const finalCompanyId = company_id || companyId;
    if (!finalCompanyId) {
      console.error('Missing companyId for supplier creation');
      return res.status(400).json({ error: 'companyId is required' });
    }

    const supplierId = id || crypto.randomUUID();
    const [result] = await pool.query(
      'INSERT INTO suppliers (id, name, contact, email, company_id) VALUES (?, ?, ?, ?, ?)',
      [supplierId, name, contact, email, finalCompanyId]
    );
    console.log('Supplier created successfully:', supplierId);
    res.status(201).json({ id: supplierId });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier', details: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, email } = req.body;
    await pool.query(
      'UPDATE suppliers SET name = ?, contact = ?, email = ? WHERE id = ?',
      [name, contact, email, id]
    );
    res.json({ message: 'Supplier updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update supplier' });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);
    res.json({ message: 'Supplier deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
};
