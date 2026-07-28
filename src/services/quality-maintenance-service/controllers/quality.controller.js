import pool  from '../../../config/db.config.js';
import crypto from 'crypto';

// --- Quality Checks ---

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
      checklistResults: row.checklist_results,
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
      checklistResults, checklist_results,
      companyId, company_id 
    } = req.body;
    
    const finalReferenceId = referenceId || reference_id;
    const finalReferenceType = referenceType || reference_type;
    const finalItemId = itemId || item_id;
    const finalInspectorId = inspectorId || inspector_id;
    const finalCheckDate = checkDate || check_date || new Date().toISOString().split('T')[0];
    const finalChecklistResults = checklistResults || checklist_results || null;
    const finalCompanyId = companyId || company_id;

    const id = crypto.randomUUID();
    const finalStatus = status || 'pending';

    await pool.query(
      'INSERT INTO quality_checks (id, reference_id, reference_type, item_id, inspector_id, check_date, status, notes, checklist_results, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, finalReferenceId, finalReferenceType, finalItemId, finalInspectorId, finalCheckDate, finalStatus, notes || '', JSON.stringify(finalChecklistResults), finalCompanyId]
    );

    // Algorithm Step 6: Post-Inspection Automated Actions
    if (finalReferenceType === 'grn') {
      if (finalStatus === 'passed') {
        // Path A (Quality Pass):
        // System updates Goods Received Note status to "inspected"
        await pool.query('UPDATE grns SET status = ? WHERE id = ?', ['inspected', finalReferenceId]);
        
        // System updates purchase order status to "received"
        const [grns] = await pool.query('SELECT purchase_order_id, warehouse_id FROM grns WHERE id = ?', [finalReferenceId]);
        if (grns.length > 0) {
           const { purchase_order_id, warehouse_id } = grns[0];
           await pool.query('UPDATE purchase_orders SET status = ? WHERE id = ?', ['received', purchase_order_id]);
           
           // System increments stock balance quantity in warehouse inventory.
           // First, find the quantity from the grn_items table for this item.
           const [grnItems] = await pool.query('SELECT quantity FROM grn_items WHERE grn_id = ? AND item_id = ?', [finalReferenceId, finalItemId]);
           if (grnItems.length > 0) {
              const qty = grnItems[0].quantity;
              
              // Check if inventory record already exists for this unit_id and item_id
              const [inv] = await pool.query('SELECT id, quantity FROM inventory WHERE unit_id = ? AND item_id = ?', [warehouse_id, finalItemId]);
              if (inv.length > 0) {
                 await pool.query('UPDATE inventory SET quantity = quantity + ? WHERE id = ?', [qty, inv[0].id]);
              } else {
                 const invId = crypto.randomUUID();
                 await pool.query(
                    `INSERT INTO inventory (id, unit_id, item_id, item_type, quantity, company_id) VALUES (?, ?, ?, 'material', ?, ?)`,
                    [invId, warehouse_id, finalItemId, qty, finalCompanyId]
                 );
              }
           }
        }
      } else if (finalStatus === 'failed' || finalStatus === 'quarantined') {
        // Path B (Quality Fail): Auto-generate NCR with status open and disposition quarantine.
        const ncrId = crypto.randomUUID();
        await pool.query(
          'INSERT INTO non_conformance_reports (id, quality_check_id, issue_description, severity, status, disposition, company_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [ncrId, id, 'Auto-generated NCR from failed/quarantined quality check', 'high', 'open', 'quarantine', finalCompanyId, finalInspectorId]
        );
      }
    } else if (finalStatus === 'failed') {
      // Legacy catch-all for other failed checks
      const ncrId = crypto.randomUUID();
      await pool.query(
        'INSERT INTO non_conformance_reports (id, quality_check_id, issue_description, severity, status, company_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [ncrId, id, 'Auto-generated NCR from failed quality check', 'medium', 'open', finalCompanyId, finalInspectorId]
      );
    }

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
      notes,
      checklistResults
    } = req.body;
    
    // fetch existing
    const [existing] = await pool.query('SELECT * FROM quality_checks WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({error: 'Not found'});
    const current = existing[0];

    const finalStatus = status || current.status;
    const finalNotes = notes !== undefined ? notes : current.notes;
    const finalResults = checklistResults !== undefined ? JSON.stringify(checklistResults) : current.checklist_results;

    await pool.query(
      'UPDATE quality_checks SET status = ?, notes = ?, checklist_results = ? WHERE id = ?',
      [
        finalStatus, 
        finalNotes, 
        finalResults,
        id
      ]
    );

    // Algorithm Step 6: Post-Inspection Automated Actions (on update)
    if (current.reference_type === 'grn' && finalStatus !== current.status) {
      if (finalStatus === 'passed') {
        // Path A (Quality Pass):
        // System updates Goods Received Note status to "inspected"
        await pool.query('UPDATE grns SET status = ? WHERE id = ?', ['inspected', current.reference_id]);
        
        // System updates purchase order status to "received"
        const [grns] = await pool.query('SELECT purchase_order_id, warehouse_id FROM grns WHERE id = ?', [current.reference_id]);
        if (grns.length > 0) {
           const { purchase_order_id, warehouse_id } = grns[0];
           await pool.query('UPDATE purchase_orders SET status = ? WHERE id = ?', ['received', purchase_order_id]);
           
           // System increments stock balance quantity in warehouse inventory.
           const [grnItems] = await pool.query('SELECT quantity FROM grn_items WHERE grn_id = ? AND item_id = ?', [current.reference_id, current.item_id]);
           if (grnItems.length > 0) {
              const qty = grnItems[0].quantity;
              const [inv] = await pool.query('SELECT id, quantity FROM inventory WHERE unit_id = ? AND item_id = ?', [warehouse_id, current.item_id]);
              if (inv.length > 0) {
                 await pool.query('UPDATE inventory SET quantity = quantity + ? WHERE id = ?', [qty, inv[0].id]);
              } else {
                 const invId = crypto.randomUUID();
                 await pool.query(
                    `INSERT INTO inventory (id, unit_id, item_id, item_type, quantity, company_id) VALUES (?, ?, ?, 'material', ?, ?)`,
                    [invId, warehouse_id, current.item_id, qty, current.company_id]
                 );
              }
           }
        }
      } else if (finalStatus === 'failed' || finalStatus === 'quarantined') {
        // Path B (Quality Fail): Auto-generate NCR with status open and disposition quarantine.
        const ncrId = crypto.randomUUID();
        await pool.query(
          'INSERT INTO non_conformance_reports (id, quality_check_id, issue_description, severity, status, disposition, company_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [ncrId, id, 'Auto-generated NCR from failed/quarantined quality check', 'high', 'open', 'quarantine', current.company_id, current.inspector_id]
        );
      }
    }

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

// --- Quality Checklists ---

export const getQualityChecklists = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId is required' });

    const [rows] = await pool.query('SELECT * FROM quality_checklists WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
    const formattedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      items: row.items,
      companyId: row.company_id,
      createdAt: row.created_at
    }));
    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching quality checklists:', error);
    res.status(500).json({ error: 'Failed to fetch checklists', details: error.message });
  }
};

export const createQualityChecklist = async (req, res) => {
  try {
    const { name, category, items, companyId } = req.body;
    if (!name || !category || !items || !companyId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO quality_checklists (id, name, category, items, company_id) VALUES (?, ?, ?, ?, ?)',
      [id, name, category, JSON.stringify(items), companyId]
    );
    res.status(201).json({ id });
  } catch (error) {
    console.error('Error creating checklist:', error);
    res.status(500).json({ error: 'Failed to create checklist', details: error.message });
  }
};

export const updateQualityChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, items } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM quality_checklists WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({error: 'Not found'});
    
    await pool.query(
      'UPDATE quality_checklists SET name = ?, category = ?, items = ? WHERE id = ?',
      [
        name || existing[0].name, 
        category || existing[0].category, 
        items ? JSON.stringify(items) : existing[0].items, 
        id
      ]
    );
    res.json({ message: 'Checklist updated' });
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(500).json({ error: 'Failed to update checklist' });
  }
};

export const deleteQualityChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM quality_checklists WHERE id = ?', [id]);
    res.json({ message: 'Checklist deleted' });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    res.status(500).json({ error: 'Failed to delete checklist' });
  }
};

// --- Non-Conformance Reports (NCRs) ---

export const getNCRs = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId is required' });

    const [rows] = await pool.query('SELECT * FROM non_conformance_reports WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
    const formattedRows = rows.map(row => ({
      id: row.id,
      qualityCheckId: row.quality_check_id,
      issueDescription: row.issue_description,
      severity: row.severity,
      status: row.status,
      rcaDetails: row.rca_details,
      capaDetails: row.capa_details,
      disposition: row.disposition,
      resolutionNotes: row.resolution_notes,
      companyId: row.company_id,
      createdBy: row.created_by,
      resolvedBy: row.resolved_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching NCRs:', error);
    res.status(500).json({ error: 'Failed to fetch NCRs', details: error.message });
  }
};

export const updateNCR = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rcaDetails, capaDetails, disposition, resolutionNotes, resolvedBy } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM non_conformance_reports WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({error: 'Not found'});
    
    const ncr = existing[0];
    
    // Maker-checker rule: Creator cannot resolve their own NCR
    if (status === 'resolved' && ncr.status !== 'resolved') {
      if (!resolvedBy) {
         return res.status(400).json({ error: 'resolvedBy is required to resolve an NCR' });
      }
      if (ncr.created_by === resolvedBy) {
         return res.status(403).json({ error: 'MAKER_CHECKER_VIOLATION: The creator of an NCR cannot resolve it.' });
      }
    }
    
    // Similarly, applying disposition might be a "Checker" action, but let's just stick to the stated 'resolve' rule.
    
    await pool.query(
      'UPDATE non_conformance_reports SET status = ?, rca_details = ?, capa_details = ?, disposition = ?, resolution_notes = ?, resolved_by = ? WHERE id = ?',
      [
        status || ncr.status, 
        rcaDetails !== undefined ? rcaDetails : ncr.rca_details,
        capaDetails !== undefined ? capaDetails : ncr.capa_details,
        disposition !== undefined ? disposition : ncr.disposition,
        resolutionNotes !== undefined ? resolutionNotes : ncr.resolution_notes, 
        resolvedBy || ncr.resolved_by, 
        id
      ]
    );
    res.json({ message: 'NCR updated' });
  } catch (error) {
    console.error('Error updating NCR:', error);
    res.status(500).json({ error: 'Failed to update NCR' });
  }
};
