import pool from '../db.js';
import crypto from 'node:crypto';

export const getAllRecipes = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM recipes';
    let params = [];
    if (companyId) {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    const [rows] = await pool.query(query, params);
    
    // map snake_case to camelCase
    const mappedRows = rows.map(row => ({
      ...row,
      productId: row.product_id,
      companyId: row.company_id,
      yieldPercentage: row.yield_percentage,
      processingSteps: row.processing_steps,
      createdAt: row.created_at
    }));

    mappedRows.forEach(row => {
      if (typeof row.bom === 'string') {
        try { row.bom = JSON.parse(row.bom); } catch (e) {}
      }
      if (typeof row.processingSteps === 'string') {
        try { row.processingSteps = JSON.parse(row.processingSteps); } catch (e) {}
      }
    });
    
    res.json(mappedRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
};

export const createRecipe = async (req, res) => {
  try {
    const { 
      productId, product_id, 
      name, 
      bom, 
      processingSteps, processing_steps, 
      yieldPercentage, yield_percentage, 
      companyId, company_id 
    } = req.body;
    
    const finalProductId = productId || product_id;
    const finalProcessingSteps = processingSteps || processing_steps;
    const finalYieldPercentage = yieldPercentage !== undefined ? yieldPercentage : yield_percentage;
    const finalCompanyId = companyId || company_id;

    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO recipes (id, product_id, name, bom, processing_steps, yield_percentage, company_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, finalProductId, name, JSON.stringify(bom || []), JSON.stringify(finalProcessingSteps || []), finalYieldPercentage || 100, finalCompanyId]
    );
    res.status(201).json({ id });
  } catch (error) {
    console.error('Create recipe error:', error);
    res.status(500).json({ error: 'Failed to create recipe', details: error.message });
  }
};

export const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      productId, product_id, 
      name, 
      bom, 
      processingSteps, processing_steps, 
      yieldPercentage, yield_percentage 
    } = req.body;
    
    const finalProductId = productId || product_id;
    const finalProcessingSteps = processingSteps || processing_steps;
    const finalYieldPercentage = yieldPercentage !== undefined ? yieldPercentage : yield_percentage;

    await pool.query(
      'UPDATE recipes SET product_id = ?, name = ?, bom = ?, processing_steps = ?, yield_percentage = ? WHERE id = ?',
      [finalProductId, name, JSON.stringify(bom || []), JSON.stringify(finalProcessingSteps || []), finalYieldPercentage, id]
    );
    res.json({ message: 'Recipe updated' });
  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(500).json({ error: 'Failed to update recipe', details: error.message });
  }
};

export const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM recipes WHERE id = ?', [id]);
    res.json({ message: 'Recipe deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
};
