import pool from '../../../db.js';
import crypto from 'node:crypto';

export const getWeighbridgeLogs = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = `
      SELECT wl.*, po.id as po_id 
      FROM weighbridge_logs wl
      LEFT JOIN purchase_orders po ON wl.reference_id = po.id
    `;
    let params = [];
    if (companyId) {
      query += ' WHERE wl.company_id = ?';
      params.push(companyId);
    }
    query += ' ORDER BY wl.entry_time DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching weighbridge logs:', error);
    res.status(500).json({ error: 'Failed to fetch weighbridge logs' });
  }
};

export const createWeighbridgeLog = async (req, res) => {
  try {
    const { 
      reference_type, reference_id, truck_plate, driver_name, 
      gross_weight, tare_weight, net_weight, company_id 
    } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    const logId = crypto.randomUUID();
    const entry_time = new Date();

    await pool.query(
      `INSERT INTO weighbridge_logs 
      (id, reference_type, reference_id, truck_plate, driver_name, gross_weight, tare_weight, net_weight, entry_time, company_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [logId, reference_type, reference_id, truck_plate, driver_name, gross_weight, tare_weight, net_weight, entry_time, company_id]
    );

    res.status(201).json({ id: logId, message: 'Weighbridge log created successfully' });
  } catch (error) {
    console.error('Error creating weighbridge log:', error);
    res.status(500).json({ error: 'Failed to create weighbridge log' });
  }
};

export const updateWeighbridgeLogOut = async (req, res) => {
  try {
    const { id } = req.params;
    const { tare_weight, net_weight } = req.body;
    const exit_time = new Date();

    await pool.query(
      'UPDATE weighbridge_logs SET tare_weight = ?, net_weight = ?, exit_time = ? WHERE id = ?',
      [tare_weight, net_weight, exit_time, id]
    );

    res.json({ message: 'Weighbridge log updated with exit weight' });
  } catch (error) {
    console.error('Error updating weighbridge log:', error);
    res.status(500).json({ error: 'Failed to update weighbridge log' });
  }
};
