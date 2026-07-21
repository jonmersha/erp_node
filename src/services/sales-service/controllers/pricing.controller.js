import pool from '../../../config/db.config.js';
import crypto from 'crypto';

export const getPricingRules = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId is required' });

    const [rows] = await pool.query('SELECT * FROM dynamic_pricing_rules WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching pricing rules:', error);
    res.status(500).json({ error: 'Failed to fetch pricing rules' });
  }
};

export const createPricingRule = async (req, res) => {
  try {
    const { companyId, ruleName, productId, conditionType, conditionValue, adjustmentType, adjustmentValue } = req.body;
    
    if (!companyId || !ruleName || !conditionType || !conditionValue || !adjustmentType || adjustmentValue === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO dynamic_pricing_rules (id, company_id, rule_name, product_id, condition_type, condition_value, adjustment_type, adjustment_value, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [id, companyId, ruleName, productId || null, conditionType, conditionValue, adjustmentType, adjustmentValue]
    );

    res.status(201).json({ id, message: 'Pricing rule created successfully' });
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    res.status(500).json({ error: 'Failed to create pricing rule' });
  }
};

export const deletePricingRule = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM dynamic_pricing_rules WHERE id = ?', [id]);
    res.json({ message: 'Pricing rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting pricing rule:', error);
    res.status(500).json({ error: 'Failed to delete pricing rule' });
  }
};

// Evaluate price logic (Simulator endpoint)
export const simulatePrice = async (req, res) => {
  try {
    const { companyId, productId, quantity } = req.body;
    if (!companyId || !productId || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the base price of the product
    const [products] = await pool.query('SELECT price FROM products WHERE id = ? AND company_id = ?', [productId, companyId]);
    if (products.length === 0) return res.status(404).json({ error: 'Product not found' });
    const basePrice = parseFloat(products[0].price);

    // Get active rules for this product or global rules
    const [rules] = await pool.query(
      `SELECT * FROM dynamic_pricing_rules 
       WHERE company_id = ? AND active = 1 AND (product_id = ? OR product_id IS NULL)`, 
      [companyId, productId]
    );

    let finalPrice = basePrice;
    let appliedRules = [];

    for (const rule of rules) {
      let applies = false;

      if (rule.condition_type === 'quantity_above') {
        const threshold = parseFloat(rule.condition_value);
        if (quantity >= threshold) applies = true;
      }

      if (applies) {
        appliedRules.push(rule.rule_name);
        const adjVal = parseFloat(rule.adjustment_value);
        if (rule.adjustment_type === 'percentage') {
          finalPrice = finalPrice + (basePrice * (adjVal / 100));
        } else if (rule.adjustment_type === 'fixed_amount') {
          finalPrice = finalPrice + adjVal;
        }
      }
    }

    // Ensure price doesn't drop below 0
    if (finalPrice < 0) finalPrice = 0;

    res.json({
      basePrice,
      finalPrice,
      appliedRules
    });

  } catch (error) {
    console.error('Error simulating price:', error);
    res.status(500).json({ error: 'Failed to simulate price' });
  }
};
