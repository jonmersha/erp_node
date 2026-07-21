import pool  from '../../../config/db.config.js';
import crypto from 'crypto';

export const getAllQualityChecks = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId is required' });

    const [rows] = await pool.query('SELECT * FROM quality_checks WHERE company_id = ? ORDER BY check_date DESC', [companyId]);
    const formattedRows = rows.map(row => ({
      id: row.id,
      referenceId: row.reference_id,
      referenceType: row.reference_type,
      itemId: row.item_id,
      inspectorId: row.inspector_id,
      checkDate: row.check_date,
      status: row.status,
      notes: row.notes,
      companyId: row.company_id,
      createdAt: row.created_at
    }));
    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching quality checks:', error);
    res.status(500).json({ error: 'Failed to fetch quality checks', details: error.message });
  }
};

export const createQualityCheck = async (req, res) => {
  try {
    const { 
      referenceId, reference_id,
      referenceType, reference_type,
      itemId, item_id,
      inspectorId, inspector_id,
      checkDate, check_date,
      status, 
      notes, 
      companyId, company_id 
    } = req.body;
    
    const finalReferenceId = referenceId || reference_id;
    const finalReferenceType = referenceType || reference_type;
    const finalItemId = itemId || item_id;
    const finalInspectorId = inspectorId || inspector_id;
    const finalCheckDate = checkDate || check_date || new Date().toISOString().split('T')[0];
    const finalCompanyId = companyId || company_id;

    const id = crypto.randomUUID();

    await pool.query(
      'INSERT INTO quality_checks (id, reference_id, reference_type, item_id, inspector_id, check_date, status, notes, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, finalReferenceId, finalReferenceType, finalItemId, finalInspectorId, finalCheckDate, status || 'pending', notes || '', finalCompanyId]
    );
    res.status(201).json({ id });
  } catch (error) {
    console.error('Error creating quality check:', error);
    res.status(500).json({ error: 'Failed to create quality check', details: error.message });
  }
};

export const updateQualityCheck = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      notes
    } = req.body;
    
    // fetch existing
    const [existing] = await pool.query('SELECT * FROM quality_checks WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({error: 'Not found'});
    const current = existing[0];

    await pool.query(
      'UPDATE quality_checks SET status = ?, notes = ? WHERE id = ?',
      [
        status || current.status, 
        notes !== undefined ? notes : current.notes, 
        id
      ]
    );
    res.json({ message: 'Quality check updated' });
  } catch (error) {
    console.error('Error updating quality check:', error);
    res.status(500).json({ error: 'Failed to update quality check', details: error.message });
  }
};

export const deleteQualityCheck = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM quality_checks WHERE id = ?', [id]);
    res.json({ message: 'Quality check deleted' });
  } catch (error) {
    console.error('Error deleting quality check:', error);
    res.status(500).json({ error: 'Failed to delete quality check' });
  }
};
