import pool from '../../../config/db.config.js';
import crypto from 'crypto';

export const getAssets = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

    const [rows] = await pool.query(
      `SELECT id, company_id as companyId, asset_name as assetName, asset_type as assetType, 
              purchase_date as purchaseDate, purchase_cost as purchaseCost, 
              salvage_value as salvageValue, useful_life_years as usefulLifeYears, 
              depreciation_method as depreciationMethod, status, created_at as createdAt 
       FROM fixed_assets WHERE company_id = ? ORDER BY created_at DESC`,
      [companyId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching fixed assets:', error);
    res.status(500).json({ error: 'Failed to fetch fixed assets' });
  }
};

export const createAsset = async (req, res) => {
  try {
    const { 
      companyId, assetName, assetType, purchaseDate, 
      purchaseCost, salvageValue, usefulLifeYears, depreciationMethod 
    } = req.body;

    if (!companyId || !assetName || !assetType || !purchaseDate || !purchaseCost || !usefulLifeYears) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = crypto.randomUUID();

    await pool.query(
      `INSERT INTO fixed_assets 
       (id, company_id, asset_name, asset_type, purchase_date, purchase_cost, salvage_value, useful_life_years, depreciation_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, companyId, assetName, assetType, purchaseDate, 
        parseFloat(purchaseCost), parseFloat(salvageValue || 0), 
        parseInt(usefulLifeYears), depreciationMethod || 'straight_line'
      ]
    );

    res.status(201).json({ id, message: 'Asset created successfully' });
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Failed to create fixed asset' });
  }
};

export const updateAssetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query('UPDATE fixed_assets SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: 'Asset status updated' });
  } catch (error) {
    console.error('Error updating asset status:', error);
    res.status(500).json({ error: 'Failed to update asset status' });
  }
};
