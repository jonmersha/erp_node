import pool from '../../../db.js';
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
    const { id, name, contact, email, company_id, companyId, certificate_url, is_authorized, status, createdBy, category, risk_rating, payment_terms, bank_account, tax_id } = req.body;
    console.log('Attempting to create supplier:', { name, companyId: company_id || companyId });
    
    const finalCompanyId = company_id || companyId;
    if (!finalCompanyId) {
      console.error('Missing companyId for supplier creation');
      return res.status(400).json({ error: 'companyId is required' });
    }

    const supplierId = id || crypto.randomUUID();
    const [result] = await pool.query(
      'INSERT INTO suppliers (id, name, contact, email, company_id, certificate_url, is_authorized, status, created_by, category, risk_rating, payment_terms, bank_account, tax_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [supplierId, name, contact, email, finalCompanyId, certificate_url || null, is_authorized ? 1 : 0, status || 'pending_approval', createdBy || null, category || null, risk_rating || 3, payment_terms || null, bank_account || null, tax_id || null]
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
    const { name, contact, email, certificate_url, is_authorized, status, category, risk_rating, payment_terms, bank_account, tax_id } = req.body;
    await pool.query(
      'UPDATE suppliers SET name = ?, contact = ?, email = ?, certificate_url = ?, is_authorized = ?, status = ?, category = ?, risk_rating = ?, payment_terms = ?, bank_account = ?, tax_id = ? WHERE id = ?',
      [name, contact, email, certificate_url || null, is_authorized ? 1 : 0, status || 'inactive', category || null, risk_rating || 3, payment_terms || null, bank_account || null, tax_id || null, id]
    );
    res.json({ message: 'Supplier updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update supplier' });
  }
};

export const approveSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId } = req.body;
    
    // Four eyes principle: get the supplier to check created_by
    const [suppliers] = await pool.query('SELECT created_by FROM suppliers WHERE id = ?', [id]);
    if (suppliers.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    
    if (suppliers[0].created_by === approverId) {
      return res.status(403).json({ error: 'Maker cannot be the checker. You cannot approve this supplier.' });
    }

    await pool.query(
      'UPDATE suppliers SET status = ?, is_authorized = ?, approved_by = ? WHERE id = ?',
      ['active', 1, approverId, id]
    );
    res.json({ message: 'Supplier approved successfully' });
  } catch (error) {
    console.error('Error approving supplier:', error);
    res.status(500).json({ error: 'Failed to approve supplier' });
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
