import pool from '../../../config/db.config.js';
import crypto from 'node:crypto';

export const getPurchaseRequisitions = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = `
      SELECT pr.*, d.name as departmentName
      FROM purchase_requisitions pr
      LEFT JOIN departments d ON pr.department_id = d.id
    `;
    let params = [];
    if (companyId) {
      query += ' WHERE pr.company_id = ?';
      params.push(companyId);
    }
    query += ' ORDER BY pr.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching PRs:', error);
    res.status(500).json({ error: 'Failed to fetch purchase requisitions' });
  }
};

export const createPurchaseRequisition = async (req, res) => {
  try {
    const { 
      department_id, item_id, item_name, quantity, 
      required_date, budget_code, notes, created_by, company_id 
    } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    const prId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO purchase_requisitions 
      (id, department_id, item_id, item_name, quantity, required_date, budget_code, notes, created_by, company_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [prId, department_id, item_id, item_name, quantity, required_date, budget_code, notes, created_by, company_id]
    );

    res.status(201).json({ id: prId, message: 'Purchase Requisition created successfully' });
  } catch (error) {
    console.error('Error creating PR:', error);
    res.status(500).json({ error: 'Failed to create purchase requisition' });
  }
};

export const approvePurchaseRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId } = req.body;

    // Check Maker/Checker
    const [prs] = await pool.query('SELECT created_by, quantity FROM purchase_requisitions WHERE id = ?', [id]);
    if (prs.length === 0) return res.status(404).json({ error: 'PR not found' });
    
    if (prs[0].created_by === approverId) {
      return res.status(403).json({ error: 'Maker cannot be the checker. You cannot approve this requisition.' });
    }

    await pool.query(
      'UPDATE purchase_requisitions SET status = ?, approved_by = ? WHERE id = ?',
      ['approved', approverId, id]
    );

    res.json({ message: 'Purchase Requisition approved successfully' });
  } catch (error) {
    console.error('Error approving PR:', error);
    res.status(500).json({ error: 'Failed to approve purchase requisition' });
  }
};

export const rejectPurchaseRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE purchase_requisitions SET status = ? WHERE id = ?',
      ['rejected', id]
    );
    res.json({ message: 'Purchase Requisition rejected' });
  } catch (error) {
    console.error('Error rejecting PR:', error);
    res.status(500).json({ error: 'Failed to reject purchase requisition' });
  }
};
