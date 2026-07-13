import pool from '../db.js';
import crypto from 'node:crypto';

export const getAllProductionRuns = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM production_runs';
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
      recipeId: row.recipe_id,
      quantityPlanned: typeof row.quantity_planned === 'string' ? parseFloat(row.quantity_planned) : row.quantity_planned,
      quantityProduced: typeof row.quantity_produced === 'string' ? parseFloat(row.quantity_produced) : row.quantity_produced,
      quantity: typeof row.quantity_planned === 'string' ? parseFloat(row.quantity_planned) : row.quantity_planned,
      startDate: row.start_date,
      createdAt: row.created_at
    }));
    res.json(mappedRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch production runs' });
  }
};

export const createProductionRun = async (req, res) => {
  try {
    const { 
      id, 
      factoryId, factory_id, 
      productId, product_id, 
      recipeId, recipe_id, 
      quantityPlanned, quantity_planned, quantity, 
      quantityProduced, quantity_produced, 
      status, 
      startDate, start_date, 
      companyId, company_id 
    } = req.body;
    
    const runId = id || crypto.randomUUID();
    const finalStartDate = startDate || start_date;
    const formattedStartDate = finalStartDate ? new Date(finalStartDate).toISOString().slice(0, 19).replace('T', ' ') : null;
    const finalQuantityPlanned = quantityPlanned || quantity_planned || quantity || 0;

    await pool.query(
      'INSERT INTO production_runs (id, factory_id, product_id, recipe_id, quantity_planned, quantity_produced, status, start_date, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        runId, 
        factoryId || factory_id || null, 
        productId || product_id || null, 
        recipeId || recipe_id || null, 
        finalQuantityPlanned, 
        quantityProduced || quantity_produced || 0, 
        status, 
        formattedStartDate, 
        companyId || company_id
      ]
    );
    res.status(201).json({ id: runId });
  } catch (error) {
    console.error('Error creating production run:', error);
    res.status(500).json({ error: 'Failed to create production run', details: error.message });
  }
};

export const updateProductionRun = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      factoryId, factory_id, 
      productId, product_id, 
      recipeId, recipe_id, 
      quantityPlanned, quantity_planned, 
      quantityProduced, quantity_produced, 
      status, 
      startDate, start_date 
    } = req.body;
    
    // First, fetch the existing record to handle partial updates
    const [existing] = await pool.query('SELECT * FROM production_runs WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Production run not found' });
    }
    const current = existing[0];
    
    const finalStartDate = startDate || start_date || current.start_date;
    const formattedStartDate = finalStartDate ? new Date(finalStartDate).toISOString().slice(0, 19).replace('T', ' ') : null;

    await pool.query(
      'UPDATE production_runs SET factory_id = ?, product_id = ?, recipe_id = ?, quantity_planned = ?, quantity_produced = ?, status = ?, start_date = ? WHERE id = ?',
      [
        factoryId || factory_id || current.factory_id, 
        productId || product_id || current.product_id, 
        recipeId || recipe_id || current.recipe_id, 
        quantityPlanned !== undefined ? quantityPlanned : (quantity_planned !== undefined ? quantity_planned : current.quantity_planned), 
        quantityProduced !== undefined ? quantityProduced : (quantity_produced !== undefined ? quantity_produced : current.quantity_produced), 
        status || current.status, 
        formattedStartDate, 
        id
      ]
    );
    res.json({ message: 'Production run updated' });
  } catch (error) {
    console.error('Error updating production run:', error);
    res.status(500).json({ error: 'Failed to update production run', details: error.message });
  }
};

export const deleteProductionRun = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM production_runs WHERE id = ?', [id]);
    res.json({ message: 'Production run deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete production run' });
  }
};
