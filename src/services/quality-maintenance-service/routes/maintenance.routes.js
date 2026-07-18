import express from 'express';
import pool from '../../../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/logs', async (req, res) => {
  const { companyId } = req.query;
  if (!companyId) {
    return res.status(400).json({ error: 'Company ID is required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, company_id as companyId, equipment_id as equipmentId, date, description, technician, cost FROM maintenance_logs WHERE company_id = ? ORDER BY date DESC',
      [companyId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching maintenance logs:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
});

router.post('/logs', async (req, res) => {
  const { companyId, equipmentId, date, description, technician, cost } = req.body;
  if (!companyId || !description) {
    return res.status(400).json({ error: 'Company ID and description are required' });
  }

  const id = uuidv4();
  try {
    await pool.query(
      'INSERT INTO maintenance_logs (id, company_id, equipment_id, date, description, technician, cost) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, companyId, equipmentId || null, date, description, technician || null, cost || 0]
    );
    res.status(201).json({ id, companyId, equipmentId, date, description, technician, cost });
  } catch (error) {
    console.error('Error adding maintenance log:', error);
    res.status(500).json({ error: 'Failed to add maintenance log' });
  }
});

router.put('/logs/:id', async (req, res) => {
  const { id } = req.params;
  const { equipmentId, date, description, technician, cost } = req.body;

  try {
    await pool.query(
      'UPDATE maintenance_logs SET equipment_id = ?, date = ?, description = ?, technician = ?, cost = ? WHERE id = ?',
      [equipmentId, date, description, technician, cost, id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating maintenance log:', error);
    res.status(500).json({ error: 'Failed to update maintenance log' });
  }
});

router.delete('/logs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM maintenance_logs WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting maintenance log:', error);
    res.status(500).json({ error: 'Failed to delete maintenance log' });
  }
});

export default router;
