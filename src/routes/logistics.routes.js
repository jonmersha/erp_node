import express from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/shipments', async (req, res) => {
  const { companyId } = req.query;
  if (!companyId) {
    return res.status(400).json({ error: 'Company ID is required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, company_id as companyId, order_id as orderId, status, delivery_date as deliveryDate, temperature_log as temperatureLog FROM logistics_shipments WHERE company_id = ? ORDER BY delivery_date DESC',
      [companyId]
    );
    // parse temperature_log from JSON string if needed
    const shipments = rows.map(row => ({
      ...row,
      temperatureLog: typeof row.temperatureLog === 'string' ? JSON.parse(row.temperatureLog) : (row.temperatureLog || [])
    }));
    res.json(shipments);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

router.post('/shipments', async (req, res) => {
  const { companyId, orderId, status, deliveryDate, temperatureLog } = req.body;
  if (!companyId) {
    return res.status(400).json({ error: 'Company ID is required' });
  }

  const id = uuidv4();
  try {
    await pool.query(
      'INSERT INTO logistics_shipments (id, company_id, order_id, status, delivery_date, temperature_log) VALUES (?, ?, ?, ?, ?, ?)',
      [id, companyId, orderId || null, status || 'pending', deliveryDate || null, JSON.stringify(temperatureLog || [])]
    );
    res.status(201).json({ id, companyId, orderId, status, deliveryDate, temperatureLog: temperatureLog || [] });
  } catch (error) {
    console.error('Error adding shipment:', error);
    res.status(500).json({ error: 'Failed to add shipment' });
  }
});

router.put('/shipments/:id', async (req, res) => {
  const { id } = req.params;
  const { orderId, status, deliveryDate, temperatureLog } = req.body;

  try {
    await pool.query(
      'UPDATE logistics_shipments SET order_id = ?, status = ?, delivery_date = ?, temperature_log = ? WHERE id = ?',
      [orderId, status, deliveryDate, JSON.stringify(temperatureLog || []), id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating shipment:', error);
    res.status(500).json({ error: 'Failed to update shipment' });
  }
});

router.delete('/shipments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM logistics_shipments WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting shipment:', error);
    res.status(500).json({ error: 'Failed to delete shipment' });
  }
});

export default router;
