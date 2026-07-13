import pool from '../db.js';
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
    const { 
      factoryId, factory_id,
      warehouseId, warehouse_id,
      materialId, material_id, 
      year, 
      totalQuantity, total_quantity, 
      status, 
      companyId, company_id, 
      quarterlyPlans, quarterly_plans 
    } = req.body;
    
    const finalFactoryId = factoryId || factory_id || null;
    const finalWarehouseId = warehouseId || warehouse_id || null;
    const finalMaterialId = materialId || material_id || null;
    const finalTotalQuantity = totalQuantity || total_quantity;
    const finalCompanyId = companyId || company_id;
    const finalQuarterlyPlans = quarterlyPlans || quarterly_plans;

    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO procurement_plans (id, factory_id, warehouse_id, material_id, year, total_quantity, status, company_id, quarterly_plans) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, finalFactoryId, finalWarehouseId, finalMaterialId, year, finalTotalQuantity, status || 'planned', finalCompanyId, JSON.stringify(finalQuarterlyPlans || [])]
    );
    res.status(201).json({ id });
  } catch (error) {
    console.error('Create procurement plan error:', error);
    res.status(500).json({ error: 'Failed to create procurement plan', details: error.message });
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
    
    const finalFactoryId = factoryId || factory_id || null;
    const finalWarehouseId = warehouseId || warehouse_id || null;
    const finalMaterialId = materialId || material_id || null;
    const finalTotalQuantity = totalQuantity || total_quantity;
    const finalQuarterlyPlans = quarterlyPlans || quarterly_plans;

    await pool.query(
      'UPDATE procurement_plans SET factory_id = ?, warehouse_id = ?, material_id = ?, year = ?, total_quantity = ?, status = ?, quarterly_plans = ? WHERE id = ?',
      [finalFactoryId, finalWarehouseId, finalMaterialId, year, finalTotalQuantity, status, JSON.stringify(finalQuarterlyPlans || []), id]
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
