import pool from '../../../config/db.config.js';
import crypto from 'node:crypto';

// RFQs
export const getAllRFQs = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId is required' });

    const [rfqs] = await pool.query('SELECT * FROM rfqs WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
    
    // Fetch items for RFQs
    const [items] = await pool.query('SELECT ri.*, rm.name as raw_material_name FROM rfq_items ri JOIN raw_materials rm ON ri.raw_material_id = rm.id WHERE ri.company_id = ?', [companyId]);
    
    // Group items by RFQ
    const itemsByRfq = items.reduce((acc, item) => {
      if (!acc[item.rfq_id]) acc[item.rfq_id] = [];
      acc[item.rfq_id].push({
        id: item.id,
        rawMaterialId: item.raw_material_id,
        rawMaterialName: item.raw_material_name,
        quantity: item.quantity
      });
      return acc;
    }, {});

    const result = rfqs.map(rfq => ({
      id: rfq.id,
      title: rfq.title,
      description: rfq.description,
      status: rfq.status,
      deadline: rfq.deadline,
      createdBy: rfq.created_by,
      companyId: rfq.company_id,
      createdAt: rfq.created_at,
      items: itemsByRfq[rfq.id] || []
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching RFQs:', error);
    res.status(500).json({ error: 'Failed to fetch RFQs' });
  }
};

export const createRFQ = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { title, description, deadline, companyId, items, createdBy } = req.body;
    
    if (!companyId || !title || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rfqId = crypto.randomUUID();
    const formattedDeadline = deadline ? new Date(deadline).toISOString().slice(0, 19).replace('T', ' ') : null;

    await connection.query(
      'INSERT INTO rfqs (id, title, description, status, deadline, company_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [rfqId, title, description || null, 'published', formattedDeadline, companyId, createdBy || null]
    );

    for (const item of items) {
      const itemId = crypto.randomUUID();
      await connection.query(
        'INSERT INTO rfq_items (id, rfq_id, raw_material_id, quantity, company_id) VALUES (?, ?, ?, ?, ?)',
        [itemId, rfqId, item.rawMaterialId, item.quantity, companyId]
      );
    }

    await connection.commit();
    res.status(201).json({ id: rfqId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating RFQ:', error);
    res.status(500).json({ error: 'Failed to create RFQ' });
  } finally {
    connection.release();
  }
};

// Bids
export const getBidsForRFQ = async (req, res) => {
  try {
    const { rfqId } = req.params;
    const { companyId } = req.query;

    const [bids] = await pool.query(`
      SELECT b.*, s.name as supplier_name, s.risk_rating as supplier_risk_rating
      FROM bids b
      JOIN suppliers s ON b.supplier_id = s.id
      WHERE b.rfq_id = ? AND b.company_id = ?
      ORDER BY b.total_amount ASC
    `, [rfqId, companyId]);

    const mappedBids = bids.map(bid => ({
      id: bid.id,
      rfqId: bid.rfq_id,
      supplierId: bid.supplier_id,
      supplierName: bid.supplier_name,
      supplierRiskRating: bid.supplier_risk_rating,
      totalAmount: bid.total_amount,
      deliveryTimeDays: bid.delivery_time_days,
      status: bid.status,
      notes: bid.notes,
      companyId: bid.company_id,
      createdAt: bid.created_at
    }));

    res.json(mappedBids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
};

export const submitBid = async (req, res) => {
  try {
    const { rfqId } = req.params;
    const { supplierId, totalAmount, deliveryTimeDays, notes, companyId } = req.body;

    if (!supplierId || !totalAmount || !companyId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const bidId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO bids (id, rfq_id, supplier_id, total_amount, delivery_time_days, notes, status, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [bidId, rfqId, supplierId, totalAmount, deliveryTimeDays || null, notes || null, 'under_review', companyId]
    );

    res.status(201).json({ id: bidId });
  } catch (error) {
    console.error('Error submitting bid:', error);
    res.status(500).json({ error: 'Failed to submit bid' });
  }
};

export const awardBid = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { rfqId, bidId } = req.params;
    const { approverId } = req.body;

    // Maker-Checker Validation
    const [rfqRows] = await connection.query('SELECT created_by FROM rfqs WHERE id = ?', [rfqId]);
    if (rfqRows.length === 0) {
      throw new Error('RFQ not found');
    }
    const rfq = rfqRows[0];
    if (rfq.created_by === approverId) {
      return res.status(403).json({ error: 'Maker cannot be the checker. You cannot award a bid for an RFQ you created.' });
    }

    // Award the bid
    await connection.query('UPDATE bids SET status = ? WHERE id = ?', ['accepted', bidId]);
    // Reject other bids
    await connection.query('UPDATE bids SET status = ? WHERE rfq_id = ? AND id != ?', ['rejected', rfqId, bidId]);
    // Close RFQ
    await connection.query('UPDATE rfqs SET status = ? WHERE id = ?', ['awarded', rfqId]);

    await connection.commit();
    res.json({ message: 'Bid awarded successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error awarding bid:', error);
    res.status(500).json({ error: error.message || 'Failed to award bid' });
  } finally {
    connection.release();
  }
};
