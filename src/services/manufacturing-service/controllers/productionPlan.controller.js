import pool from '../../../config/db.config.js';
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
    const body = req.body;
    const finalCompanyId = body.companyId || body.company_id;
    const year = body.year;
    
    // For specific checks (production, procurement, sales)
    if ('ProductionPlan' !== 'FinancialPlan') {
      const finalFactoryId = body.factoryId || body.factory_id;
      const finalProductId = body.productId || body.product_id;
      const finalMaterialId = body.materialId || body.material_id;
      const finalWarehouseId = body.warehouseId || body.warehouse_id;
      const finalRegionId = body.regionId || body.region_id;
      const finalCustomerId = body.customerId || body.customer_id;
      
      let checkArgs = [];
      if ('ProductionPlan' === 'ProductionPlan') checkArgs = [finalFactoryId, finalProductId, year];
      if ('ProductionPlan' === 'ProcurementPlan') checkArgs = [finalFactoryId, finalWarehouseId, finalMaterialId, year];
      if ('ProductionPlan' === 'SalesPlan') checkArgs = [finalRegionId, finalCustomerId, finalProductId, year];

      const [existing] = await pool.query('SELECT id FROM production_plans WHERE factory_id = ? AND product_id = ? AND year = ?', checkArgs);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'A production plan for this factory, product, and year already exists.', existingId: existing[0].id });
      }
    } else {
      const [existing] = await pool.query('SELECT id FROM production_plans WHERE factory_id = ? AND product_id = ? AND year = ?', [finalCompanyId, year, body.quarter || null]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'A production plan for this factory, product, and year already exists.', existingId: existing[0].id });
      }
    }

    const newId = crypto.randomUUID();
    
    // Map fields
    const finalTotalQty = body.totalQuantity || body.total_quantity;
    const finalStatus = body.status || 'draft';
    const finalQuarterlyPlans = JSON.stringify(body.quarterlyPlans || body.quarterly_plans || []);
    const createdBy = body.createdBy || null;

    let args = [];
    if ('ProductionPlan' === 'ProductionPlan') {
      args = [newId, body.factoryId || body.factory_id, body.productId || body.product_id, year, finalTotalQty, finalStatus, finalCompanyId, finalQuarterlyPlans, createdBy];
    } else if ('ProductionPlan' === 'ProcurementPlan') {
      args = [newId, body.factoryId || body.factory_id, body.warehouseId || body.warehouse_id, body.materialId || body.material_id, year, finalTotalQty, finalStatus, finalCompanyId, finalQuarterlyPlans, createdBy];
    } else if ('ProductionPlan' === 'SalesPlan') {
      args = [newId, body.regionId || body.region_id, body.customerId || body.customer_id, body.productId || body.product_id, year, finalTotalQty, finalStatus, finalCompanyId, finalQuarterlyPlans, createdBy];
    } else if ('ProductionPlan' === 'FinancialPlan') {
      const targetRev = body.targetRevenue || body.target_revenue;
      const targetExp = body.targetExpense || body.target_expense;
      args = [newId, finalCompanyId, year, body.quarter || null, targetRev, targetExp, finalStatus, createdBy];
    }

    await pool.query(
      'INSERT INTO production_plans (id, factory_id, product_id, year, total_quantity, status, company_id, quarterly_plans, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args
    );
    res.status(201).json({ id: newId });
  } catch (error) {
    console.error('Create ProductionPlan error:', error);
    res.status(500).json({ error: 'Failed to create ProductionPlan', details: error.message });
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
    
    const [existing] = await pool.query('SELECT * FROM production_plans WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Production plan not found' });
    const plan = existing[0];

    const finalFactoryId = factoryId || factory_id || plan.factory_id;
    const finalProductId = productId || product_id || plan.product_id;
    const finalYear = year !== undefined ? year : plan.year;
    const finalTotalQuantity = totalQuantity || total_quantity || plan.total_quantity;
    const finalStatus = status || plan.status;
    const finalQuarterlyPlans = quarterlyPlans || quarterly_plans || plan.quarterly_plans;

    await pool.query(
      'UPDATE production_plans SET factory_id = ?, product_id = ?, year = ?, total_quantity = ?, status = ?, quarterly_plans = ? WHERE id = ?',
      [finalFactoryId, finalProductId, finalYear, finalTotalQuantity, finalStatus, JSON.stringify(finalQuarterlyPlans || []), id]
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

export const rejectProductionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId, rejectionReason } = req.body;

    const [items] = await pool.query('SELECT created_by FROM production_plans WHERE id = ?', [id]);
    if (items.length === 0) return res.status(404).json({ error: 'Item not found' });
    
    if (items[0].created_by === approverId) {
      return res.status(403).json({ error: 'Maker cannot be the checker. You cannot reject this.' });
    }

    await pool.query(
      'UPDATE production_plans SET status = ?, approved_by = ?, rejection_reason = ? WHERE id = ?',
      ['rejected', approverId, rejectionReason || null, id]
    );
    res.json({ message: 'ProductionPlan rejected successfully' });
  } catch (error) {
    console.error('Error rejecting ProductionPlan:', error);
    res.status(500).json({ error: 'Failed to reject ProductionPlan' });
  }
};

