import pool from '../../../config/db.config.js';
import crypto from 'node:crypto';

export const getAllProcurementPlans = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM procurement_plans';
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
      warehouseId: row.warehouse_id,
      materialId: row.material_id,
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
    res.status(500).json({ error: 'Failed to fetch procurement plans' });
  }
};

export const createProcurementPlan = async (req, res) => {
  try {
    const body = req.body;
    const finalCompanyId = body.companyId || body.company_id;
    const year = body.year;
    
    // For specific checks (production, procurement, sales)
    if ('ProcurementPlan' !== 'FinancialPlan') {
      const finalFactoryId = body.factoryId || body.factory_id;
      const finalProductId = body.productId || body.product_id;
      const finalMaterialId = body.materialId || body.material_id;
      const finalWarehouseId = body.warehouseId || body.warehouse_id;
      const finalRegionId = body.regionId || body.region_id;
      const finalCustomerId = body.customerId || body.customer_id;
      
      let checkArgs = [];
      if ('ProcurementPlan' === 'ProductionPlan') checkArgs = [finalFactoryId, finalProductId, year];
      if ('ProcurementPlan' === 'ProcurementPlan') checkArgs = [finalFactoryId, finalWarehouseId, finalMaterialId, year];
      if ('ProcurementPlan' === 'SalesPlan') checkArgs = [finalRegionId, finalCustomerId, finalProductId, year];

      const [existing] = await pool.query('SELECT id FROM procurement_plans WHERE factory_id = ? AND warehouse_id = ? AND material_id = ? AND year = ?', checkArgs);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'A procurement plan for this factory, warehouse, material, and year already exists.', existingId: existing[0].id });
      }
    } else {
      const [existing] = await pool.query('SELECT id FROM procurement_plans WHERE factory_id = ? AND warehouse_id = ? AND material_id = ? AND year = ?', [finalCompanyId, year, body.quarter || null]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'A procurement plan for this factory, warehouse, material, and year already exists.', existingId: existing[0].id });
      }
    }

    const newId = crypto.randomUUID();
    
    // Map fields
    const finalTotalQty = body.totalQuantity || body.total_quantity;
    const finalStatus = body.status || 'draft';
    const finalQuarterlyPlans = JSON.stringify(body.quarterlyPlans || body.quarterly_plans || []);
    const createdBy = body.createdBy || null;

    let args = [];
    if ('ProcurementPlan' === 'ProductionPlan') {
      args = [newId, body.factoryId || body.factory_id, body.productId || body.product_id, year, finalTotalQty, finalStatus, finalCompanyId, finalQuarterlyPlans, createdBy];
    } else if ('ProcurementPlan' === 'ProcurementPlan') {
      args = [newId, body.factoryId || body.factory_id, body.warehouseId || body.warehouse_id, body.materialId || body.material_id, year, finalTotalQty, finalStatus, finalCompanyId, finalQuarterlyPlans, createdBy];
    } else if ('ProcurementPlan' === 'SalesPlan') {
      args = [newId, body.regionId || body.region_id, body.customerId || body.customer_id, body.productId || body.product_id, year, finalTotalQty, finalStatus, finalCompanyId, finalQuarterlyPlans, createdBy];
    } else if ('ProcurementPlan' === 'FinancialPlan') {
      const targetRev = body.targetRevenue || body.target_revenue;
      const targetExp = body.targetExpense || body.target_expense;
      args = [newId, finalCompanyId, year, body.quarter || null, targetRev, targetExp, finalStatus, createdBy];
    }

    await pool.query(
      'INSERT INTO procurement_plans (id, factory_id, warehouse_id, material_id, year, total_quantity, status, company_id, quarterly_plans, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args
    );
    res.status(201).json({ id: newId });
  } catch (error) {
    console.error('Create ProcurementPlan error:', error);
    res.status(500).json({ error: 'Failed to create ProcurementPlan', details: error.message });
  }
};

export const updateProcurementPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      factoryId, factory_id,
      warehouseId, warehouse_id, 
      materialId, material_id, 
      year, 
      totalQuantity, total_quantity, 
      status, 
      quarterlyPlans, quarterly_plans 
    } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM procurement_plans WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Procurement plan not found' });
    const plan = existing[0];

    const finalFactoryId = factoryId || factory_id || plan.factory_id;
    const finalWarehouseId = warehouseId || warehouse_id || plan.warehouse_id;
    const finalMaterialId = materialId || material_id || plan.material_id;
    const finalYear = year !== undefined ? year : plan.year;
    const finalTotalQuantity = totalQuantity || total_quantity || plan.total_quantity;
    const finalStatus = status || plan.status;
    const finalQuarterlyPlans = quarterlyPlans || quarterly_plans || plan.quarterly_plans;

    await pool.query(
      'UPDATE procurement_plans SET factory_id = ?, warehouse_id = ?, material_id = ?, year = ?, total_quantity = ?, status = ?, quarterly_plans = ? WHERE id = ?',
      [finalFactoryId, finalWarehouseId, finalMaterialId, finalYear, finalTotalQuantity, finalStatus, JSON.stringify(finalQuarterlyPlans || []), id]
    );
    res.json({ message: 'Procurement plan updated' });
  } catch (error) {
    console.error('Update procurement plan error:', error);
    res.status(500).json({ error: 'Failed to update procurement plan', details: error.message });
  }
};

export const deleteProcurementPlan = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM procurement_plans WHERE id = ?', [id]);
    res.json({ message: 'Procurement plan deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete procurement plan' });
  }
};

export const approveProcurementPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId } = req.body;

    const [plans] = await pool.query('SELECT created_by FROM procurement_plans WHERE id = ?', [id]);
    if (plans.length === 0) return res.status(404).json({ error: 'Plan not found' });
    
    if (plans[0].created_by === approverId) {
      return res.status(403).json({ error: 'Maker cannot be the checker. You cannot approve this plan.' });
    }

    await pool.query(
      'UPDATE procurement_plans SET status = ?, approved_by = ? WHERE id = ?',
      ['approved', approverId, id]
    );
    res.json({ message: 'Plan approved successfully' });
  } catch (error) {
    console.error('Error approving plan:', error);
    res.status(500).json({ error: 'Failed to approve plan' });
  }
};

export const rejectProcurementPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId, rejectionReason } = req.body;

    const [items] = await pool.query('SELECT created_by FROM procurement_plans WHERE id = ?', [id]);
    if (items.length === 0) return res.status(404).json({ error: 'Item not found' });
    
    if (items[0].created_by === approverId) {
      return res.status(403).json({ error: 'Maker cannot be the checker. You cannot reject this.' });
    }

    await pool.query(
      'UPDATE procurement_plans SET status = ?, approved_by = ?, rejection_reason = ? WHERE id = ?',
      ['rejected', approverId, rejectionReason || null, id]
    );
    res.json({ message: 'ProcurementPlan rejected successfully' });
  } catch (error) {
    console.error('Error rejecting ProcurementPlan:', error);
    res.status(500).json({ error: 'Failed to reject ProcurementPlan' });
  }
};
