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
    const { 
      factoryId, factory_id, 
      productId, product_id, 
      year, 
      totalQuantity, total_quantity, 
      status, 
      companyId, company_id, 
      createdBy,
      quarterlyPlans, quarterly_plans 
    } = req.body;
    
    const finalFactoryId = factoryId || factory_id;
    const finalProductId = productId || product_id;
    const finalTotalQuantity = totalQuantity || total_quantity;
    const finalCompanyId = companyId || company_id;
    const finalQuarterlyPlans = quarterlyPlans || quarterly_plans;

    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO sales_plans (id, factory_id, product_id, year, total_quantity, status, company_id, quarterly_plans, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, finalFactoryId, finalProductId, year, finalTotalQuantity, status || 'pending_approval', finalCompanyId, JSON.stringify(finalQuarterlyPlans || []), createdBy || null]
    );
    res.status(201).json({ id });
  } catch (error) {
    console.error('Create sales plan error:', error);
    res.status(500).json({ error: 'Failed to create sales plan', details: error.message });
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
    
    const finalFactoryId = factoryId || factory_id;
    const finalProductId = productId || product_id;
    const finalTotalQuantity = totalQuantity || total_quantity;
    const finalQuarterlyPlans = quarterlyPlans || quarterly_plans;

    await pool.query(
      'UPDATE sales_plans SET factory_id = ?, product_id = ?, year = ?, total_quantity = ?, status = ?, quarterly_plans = ? WHERE id = ?',
      [finalFactoryId, finalProductId, year, finalTotalQuantity, status, JSON.stringify(finalQuarterlyPlans || []), id]
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
