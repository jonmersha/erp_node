import pool from '../../../config/db.config.js';

export const getPOLifecycle = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get PO Details
    const [poRows] = await pool.query(
      `SELECT po.*, s.name as supplierName
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.id = ?`,
      [id]
    );

    if (poRows.length === 0) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }
    const po = poRows[0];

    // 2. Get PO Items (and see if they link to a PR)
    const [poItems] = await pool.query('SELECT * FROM purchase_order_items WHERE order_id = ?', [id]);

    // 3. Get Weighbridge Logs
    const [weighbridgeLogs] = await pool.query(
      'SELECT * FROM weighbridge_logs WHERE reference_type = "PO" AND reference_id = ? ORDER BY entry_time DESC',
      [id]
    );

    // 4. Get GRNs
    const [grns] = await pool.query('SELECT * FROM grns WHERE purchase_order_id = ? ORDER BY created_at DESC', [id]);

    // 5. Get Quality Checks linked to those GRNs
    let qualityChecks = [];
    if (grns.length > 0) {
      const grnIds = grns.map(g => g.id);
      const [qcRows] = await pool.query(
        'SELECT * FROM quality_checks WHERE reference_type = "grn" AND reference_id IN (?) ORDER BY created_at DESC',
        [grnIds]
      );
      qualityChecks = qcRows;
    }

    // 6. Get Finance Invoices
    const [invoices] = await pool.query(
      'SELECT * FROM finance_invoices WHERE order_type = "purchase" AND order_id = ? ORDER BY created_at DESC',
      [id]
    );

    res.json({
      po,
      poItems,
      weighbridgeLogs,
      grns,
      qualityChecks,
      invoices
    });
  } catch (error) {
    console.error('Error fetching PO lifecycle:', error);
    res.status(500).json({ error: 'Failed to fetch PO lifecycle data' });
  }
};
