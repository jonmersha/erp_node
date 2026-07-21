import pool from '../../../config/db.config.js';
import crypto from 'node:crypto';

export const getQualityInspections = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = `
      SELECT qi.*, wl.truck_plate, wl.reference_id 
      FROM quality_inspections qi
      LEFT JOIN weighbridge_logs wl ON qi.weighbridge_log_id = wl.id
    `;
    let params = [];
    if (companyId) {
      query += ' WHERE qi.company_id = ?';
      params.push(companyId);
    }
    query += ' ORDER BY qi.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching quality inspections:', error);
    res.status(500).json({ error: 'Failed to fetch quality inspections' });
  }
};

export const createQualityInspection = async (req, res) => {
  try {
    const { 
      weighbridge_log_id, moisture, protein, ash, gluten, 
      status, inspector_id, notes, company_id 
    } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    const qiId = crypto.randomUUID();

    await pool.query(
      `INSERT INTO quality_inspections 
      (id, weighbridge_log_id, moisture, protein, ash, gluten, status, inspector_id, notes, company_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [qiId, weighbridge_log_id, moisture, protein, ash, gluten, status, inspector_id, notes, company_id]
    );

    res.status(201).json({ id: qiId, message: 'Quality inspection created successfully' });
  } catch (error) {
    console.error('Error creating quality inspection:', error);
    res.status(500).json({ error: 'Failed to create quality inspection' });
  }
};
