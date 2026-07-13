import pool from '../db.js';
import crypto from 'node:crypto';

export const getInventory = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM inventory';
    let params = [];
    if (companyId) {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    const [rows] = await pool.query(query, params);
    
    // map snake_case to camelCase
    const mappedRows = rows.map(row => ({
      ...row,
      companyId: row.company_id,
      unitId: row.unit_id,
      itemId: row.item_id,
      itemType: row.item_type,
      batchNumber: row.batch_number,
      expiryDate: row.expiry_date
    }));
    res.json(mappedRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

export const createInventory = async (req, res) => {
  try {
    const { 
      id, 
      unitId, unit_id, 
      itemId, item_id, 
      itemType, item_type, 
      quantity, 
      batchNumber, batch_number, 
      expiryDate, expiry_date, 
      companyId, company_id 
    } = req.body;
    
    const inventoryId = id || crypto.randomUUID();
    const finalExpiryDate = expiryDate || expiry_date;
    const formattedExpiryDate = finalExpiryDate ? new Date(finalExpiryDate).toISOString().split('T')[0] : null;

    await pool.query(
      'INSERT INTO inventory (id, unit_id, item_id, item_type, quantity, batch_number, expiry_date, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [inventoryId, unitId || unit_id, itemId || item_id, itemType || item_type, quantity, batchNumber || batch_number, formattedExpiryDate, companyId || company_id]
    );
    res.status(201).json({ id: inventoryId });
  } catch (error) {
    console.error('Inventory create error', error);
    res.status(500).json({ error: 'Failed to add inventory item', details: error.message });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      unitId, unit_id, 
      itemId, item_id, 
      itemType, item_type, 
      quantity, 
      batchNumber, batch_number, 
      expiryDate, expiry_date 
    } = req.body;
    
    // fetch existing
    const [existing] = await pool.query('SELECT * FROM inventory WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({error: 'Not found'});
    const current = existing[0];
    
    const finalExpiryDate = expiryDate || expiry_date || current.expiry_date;
    const formattedExpiryDate = finalExpiryDate ? new Date(finalExpiryDate).toISOString().split('T')[0] : null;

    await pool.query(
      'UPDATE inventory SET unit_id = ?, item_id = ?, item_type = ?, quantity = ?, batch_number = ?, expiry_date = ? WHERE id = ?',
      [
        unitId || unit_id || current.unit_id, 
        itemId || item_id || current.item_id, 
        itemType || item_type || current.item_type, 
        quantity !== undefined ? quantity : current.quantity, 
        batchNumber || batch_number || current.batch_number, 
        formattedExpiryDate, 
        id
      ]
    );
    res.json({ message: 'Inventory item updated' });
  } catch (error) {
    console.error('Inventory update error', error);
    res.status(500).json({ error: 'Failed to update inventory item', details: error.message });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM inventory WHERE id = ?', [id]);
    res.json({ message: 'Inventory item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
};
