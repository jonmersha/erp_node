import pool from '../../../config/db.config.js';
import crypto from 'node:crypto';

export const getQualityInspections = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = `
      SELECT 
        qi.*,
        wl.truck_plate,
        wl.reference_id,
        wl.reference_type,
        wl.gross_weight,
        wl.net_weight,
        wl.entry_time
      FROM quality_inspections qi
      LEFT JOIN weighbridge_logs wl ON qi.weighbridge_log_id = wl.id
    `;
    const params = [];
    if (companyId) {
      query += ' WHERE qi.company_id = ?';
      params.push(companyId);
    }
    query += ' ORDER BY qi.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching quality inspections:', error);
    res.status(500).json({ error: 'Failed to fetch quality inspections', details: error.message });
  }
};

export const createQualityInspection = async (req, res) => {
  try {
    const {
      weighbridge_log_id,
      moisture, protein, ash, gluten,
      status,
      inspector_id,
      notes,
      company_id
    } = req.body;

    // Validate required fields
    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }
    if (!weighbridge_log_id) {
      return res.status(400).json({ error: 'weighbridge_log_id is required' });
    }
    if (!status) {
      return res.status(400).json({ error: 'status is required (Pending, Approved, or Rejected)' });
    }

    // Verify the weighbridge log exists
    const [wbRows] = await pool.query(
      'SELECT id, company_id FROM weighbridge_logs WHERE id = ?',
      [weighbridge_log_id]
    );
    if (wbRows.length === 0) {
      return res.status(404).json({ error: 'Weighbridge log not found. Cannot log inspection for a non-existent load.' });
    }

    // Prevent duplicate inspections for the same load
    const [existingRows] = await pool.query(
      'SELECT id FROM quality_inspections WHERE weighbridge_log_id = ?',
      [weighbridge_log_id]
    );
    if (existingRows.length > 0) {
      return res.status(409).json({
        error: 'This load already has a quality inspection. Update the existing record instead.',
        existingId: existingRows[0].id
      });
    }

    // Sanitize numeric fields — empty strings become null
    const safeMoisture = moisture !== '' && moisture != null ? Number(moisture) : null;
    const safeProtein  = protein  !== '' && protein  != null ? Number(protein)  : null;
    const safeAsh      = ash      !== '' && ash      != null ? Number(ash)      : null;
    const safeGluten   = gluten   !== '' && gluten   != null ? Number(gluten)   : null;

    const qiId = crypto.randomUUID();

    await pool.query(
      `INSERT INTO quality_inspections
       (id, weighbridge_log_id, moisture, protein, ash, gluten, status, inspector_id, notes, company_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [qiId, weighbridge_log_id, safeMoisture, safeProtein, safeAsh, safeGluten, status, inspector_id || null, notes || null, company_id]
    );

    res.status(201).json({ id: qiId, message: 'Quality inspection created successfully' });
  } catch (error) {
    console.error('Error creating quality inspection:', error);
    res.status(500).json({
      error: 'Failed to create quality inspection',
      details: error.message,
      sqlMessage: error.sqlMessage
    });
  }
};

export const updateQualityInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const { moisture, protein, ash, gluten, status, notes } = req.body;

    const [existing] = await pool.query('SELECT id FROM quality_inspections WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Quality inspection not found' });
    }

    const safeMoisture = moisture !== '' && moisture != null ? Number(moisture) : null;
    const safeProtein  = protein  !== '' && protein  != null ? Number(protein)  : null;
    const safeAsh      = ash      !== '' && ash      != null ? Number(ash)      : null;
    const safeGluten   = gluten   !== '' && gluten   != null ? Number(gluten)   : null;

    await pool.query(
      `UPDATE quality_inspections
       SET moisture = ?, protein = ?, ash = ?, gluten = ?, status = ?, notes = ?
       WHERE id = ?`,
      [safeMoisture, safeProtein, safeAsh, safeGluten, status, notes || null, id]
    );

    res.json({ message: 'Quality inspection updated successfully' });
  } catch (error) {
    console.error('Error updating quality inspection:', error);
    res.status(500).json({
      error: 'Failed to update quality inspection',
      details: error.message,
      sqlMessage: error.sqlMessage
    });
  }
};
