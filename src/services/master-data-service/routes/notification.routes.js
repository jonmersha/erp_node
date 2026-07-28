import { Router } from 'express';
import pool from '../../../config/db.config.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const companyId = req.query.companyId;
    if (!companyId) return res.json({ count: 0, items: [] });
    
    // For now, aggregate POs, PRs, and Suppliers that are pending_approval
    const [pos] = await pool.query('SELECT id, status, "Purchase Order" as type FROM purchase_orders WHERE company_id = ? AND status = "pending_approval"', [companyId]);
    const [prs] = await pool.query('SELECT id, status, "Purchase Requisition" as type FROM purchase_requisitions WHERE company_id = ? AND status = "pending_approval"', [companyId]);
    const [suppliers] = await pool.query('SELECT id, status, "Supplier" as type FROM suppliers WHERE company_id = ? AND status = "pending_approval"', [companyId]);

    const items = [...pos, ...prs, ...suppliers];
    res.json({
      count: items.length,
      items
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

export default router;
