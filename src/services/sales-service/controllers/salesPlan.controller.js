import pool from '../../../config/db.config.js';
import crypto from 'node:crypto';

export const getAllSalesPlans = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM sales_plans';
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
      factoryId: row.factory_id,
      productId: row.product_id,
      totalQuantity: row.total_quantity,
      quarterlyPlans: row.quarterly_plans,
      createdBy: row.created_by,
      approvedBy: row.approved_by,
      createdAt: row.created_at
    }));

    mappedRows.forEach(row => {
      if (typeof row.quarterlyPlans === 'string') {
        try { row.quarterlyPlans = JSON.parse(row.quarterlyPlans); } catch (e) {}
      }
    });

    res.json(mappedRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales plans' });
  }
};

export const createSalesPlan = async (req, res) => {
  try {
    const body = req.body;
    const finalCompanyId = body.companyId || body.company_id;
    const year = body.year;
    const finalFactoryId = body.factoryId || body.factory_id;
    const finalProductId = body.productId || body.product_id;
      
    const [existing] = await pool.query('SELECT id FROM sales_plans WHERE factory_id = ? AND product_id = ? AND year = ?', [finalFactoryId, finalProductId, year]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'A sales plan for this factory, product, and year already exists.', existingId: existing[0].id });
    }

    const newId = crypto.randomUUID();
    const finalTotalQty = body.totalQuantity || body.total_quantity;
    const finalStatus = body.status || 'draft';
    const finalQuarterlyPlans = JSON.stringify(body.quarterlyPlans || body.quarterly_plans || []);
    const createdBy = body.createdBy || null;

    const args = [newId, finalFactoryId, finalProductId, year, finalTotalQty, finalStatus, finalCompanyId, finalQuarterlyPlans, createdBy];

    await pool.query(
      'INSERT INTO sales_plans (id, factory_id, product_id, year, total_quantity, status, company_id, quarterly_plans, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args
    );
    res.status(201).json({ id: newId });
  } catch (error) {
    console.error('Create SalesPlan error:', error);
    res.status(500).json({ error: 'Failed to create SalesPlan', details: error.message });
  }
};

export const updateSalesPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      factoryId, factory_id, 
      productId, product_id, 
      year, 
      totalQuantity, total_quantity, 
      status, 
      quarterlyPlans, quarterly_plans 
    } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM sales_plans WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Sales plan not found' });
    const plan = existing[0];

    const finalFactoryId = factoryId || factory_id || plan.factory_id;
    const finalProductId = productId || product_id || plan.product_id;
    const finalYear = year !== undefined ? year : plan.year;
    const finalTotalQuantity = totalQuantity || total_quantity || plan.total_quantity;
    const finalStatus = status || plan.status;
    const finalQuarterlyPlans = quarterlyPlans || quarterly_plans || plan.quarterly_plans;

    await pool.query(
      'UPDATE sales_plans SET factory_id = ?, product_id = ?, year = ?, total_quantity = ?, status = ?, quarterly_plans = ? WHERE id = ?',
      [finalFactoryId, finalProductId, finalYear, finalTotalQuantity, finalStatus, JSON.stringify(finalQuarterlyPlans || []), id]
    );
    res.json({ message: 'Sales plan updated' });
  } catch (error) {
    console.error('Update sales plan error:', error);
    res.status(500).json({ error: 'Failed to update sales plan', details: error.message });
  }
};

export const deleteSalesPlan = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM sales_plans WHERE id = ?', [id]);
    res.json({ message: 'Sales plan deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sales plan' });
  }
};

export const approveSalesPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId } = req.body;

    const [plans] = await pool.query('SELECT created_by FROM sales_plans WHERE id = ?', [id]);
    if (plans.length === 0) return res.status(404).json({ error: 'Plan not found' });
    
    if (plans[0].created_by === approverId) {
      return res.status(403).json({ error: 'Maker cannot be the checker. You cannot approve this plan.' });
    }

    await pool.query(
      'UPDATE sales_plans SET status = ?, approved_by = ? WHERE id = ?',
      ['approved', approverId, id]
    );
    res.json({ message: 'Plan approved successfully' });
  } catch (error) {
    console.error('Error approving plan:', error);
    res.status(500).json({ error: 'Failed to approve plan' });
  }
};

export const rejectSalesPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId, rejectionReason } = req.body;

    const [items] = await pool.query('SELECT created_by FROM sales_plans WHERE id = ?', [id]);
    if (items.length === 0) return res.status(404).json({ error: 'Item not found' });
    
    if (items[0].created_by === approverId) {
      return res.status(403).json({ error: 'Maker cannot be the checker. You cannot reject this.' });
    }

    await pool.query(
      'UPDATE sales_plans SET status = ?, approved_by = ?, rejection_reason = ? WHERE id = ?',
      ['rejected', approverId, rejectionReason || null, id]
    );
    res.json({ message: 'SalesPlan rejected successfully' });
  } catch (error) {
    console.error('Error rejecting SalesPlan:', error);
    res.status(500).json({ error: 'Failed to reject SalesPlan' });
  }
};
