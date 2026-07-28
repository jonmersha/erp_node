import pool from '../../../config/db.config.js';
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
    console.log('[WEIGHBRIDGE CREATE] req.body:', JSON.stringify(req.body));
    const { 
      reference_type, reference_id, truck_plate, driver_name, 
      gross_weight, tare_weight, net_weight, company_id 
    } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    const logId = crypto.randomUUID();
    const entry_time = new Date();

    // Sanitize: convert empty strings to null for nullable columns
    const safeRefId = reference_id || null;
    const safeGross = gross_weight || null;
    const safeTare = tare_weight || null;
    const safeNet = net_weight || null;

    await pool.query(
      `INSERT INTO weighbridge_logs 
      (id, reference_type, reference_id, truck_plate, driver_name, gross_weight, tare_weight, net_weight, entry_time, company_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [logId, reference_type, safeRefId, truck_plate, driver_name, safeGross, safeTare, safeNet, entry_time, company_id]
    );

    // If this is for a Purchase Order, update the PO status to 'shipped'
    if (reference_type === 'PO' && safeRefId) {
      await pool.query(
        'UPDATE purchase_orders SET status = ? WHERE id = ? AND status IN ("approved", "pending")',
        ['shipped', safeRefId]
      );
    }

    res.status(201).json({ id: logId, message: 'Weighbridge log created successfully' });
  } catch (error) {
    console.error('Error creating weighbridge log:', error);
    res.status(500).json({ error: 'Failed to create weighbridge log', details: error.message, sqlMessage: error.sqlMessage });
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

    // Also update PO status to shipped if it was a PO
    const [logs] = await pool.query('SELECT reference_type, reference_id FROM weighbridge_logs WHERE id = ?', [id]);
    if (logs.length > 0 && logs[0].reference_type === 'PO' && logs[0].reference_id) {
      await pool.query(
        'UPDATE purchase_orders SET status = ? WHERE id = ? AND status IN ("approved", "pending")',
        ['shipped', logs[0].reference_id]
      );
    }

    res.json({ message: 'Weighbridge log updated with exit weight' });
  } catch (error) {
    console.error('Error updating weighbridge log:', error);
    res.status(500).json({ error: 'Failed to update weighbridge log' });
  }
};
