import pool from '../../../db.js';
import crypto from 'node:crypto';

export const getAllProductionPlans = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM production_plans';
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
      quarterlyPlans: row.quarterly_plans, // Will be auto-parsed if JSON column, or string. Better to parse.
      createdBy: row.created_by,
      approvedBy: row.approved_by,
      createdAt: new Date().toISOString() 
    }));
    
    // Ensure quarterlyPlans is an object/array not a string
    mappedRows.forEach(row => {
      if (typeof row.quarterlyPlans === 'string') {
        try { row.quarterlyPlans = JSON.parse(row.quarterlyPlans); } catch (e) {}
      }
    });

    res.json(mappedRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch production plans' });
  }
};

export const createProductionPlan = async (req, res) => {
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

    const [existing] = await pool.query(
      'SELECT id FROM production_plans WHERE factory_id = ? AND product_id = ? AND year = ? AND company_id = ?',
      [finalFactoryId, finalProductId, year, finalCompanyId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'A production plan for this factory, product, and year already exists.' });
    }

    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO production_plans (id, factory_id, product_id, year, total_quantity, status, company_id, quarterly_plans, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, finalFactoryId, finalProductId, year, finalTotalQuantity, status || 'pending_approval', finalCompanyId, JSON.stringify(finalQuarterlyPlans || []), createdBy || null]
    );
    res.status(201).json({ id });
  } catch (error) {
    console.error('Create production plan error:', error);
    res.status(500).json({ error: 'Failed to create production plan', details: error.message });
  }
};

export const updateProductionPlan = async (req, res) => {
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
      'UPDATE production_plans SET factory_id = ?, product_id = ?, year = ?, total_quantity = ?, status = ?, quarterly_plans = ? WHERE id = ?',
      [finalFactoryId, finalProductId, year, finalTotalQuantity, status, JSON.stringify(finalQuarterlyPlans || []), id]
    );
    res.json({ message: 'Production plan updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update production plan', details: error.message });
  }
};

export const deleteProductionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM production_plans WHERE id = ?', [id]);
    res.json({ message: 'Production plan deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete production plan' });
  }
};

export const approveProductionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId } = req.body;

    const [plans] = await pool.query('SELECT created_by FROM production_plans WHERE id = ?', [id]);
    if (plans.length === 0) return res.status(404).json({ error: 'Plan not found' });
    
    if (plans[0].created_by === approverId) {
      return res.status(403).json({ error: 'Maker cannot be the checker. You cannot approve this plan.' });
    }

    await pool.query(
      'UPDATE production_plans SET status = ?, approved_by = ? WHERE id = ?',
      ['approved', approverId, id]
    );
    res.json({ message: 'Plan approved successfully' });
  } catch (error) {
    console.error('Error approving plan:', error);
    res.status(500).json({ error: 'Failed to approve plan' });
  }
};

