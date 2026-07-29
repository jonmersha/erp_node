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

    // 2. Get PO Items with ordered quantities
    const [poItems] = await pool.query('SELECT * FROM purchase_order_items WHERE order_id = ?', [id]);

    // 3. Get ALL Weighbridge Logs for this PO (multiple deliveries)
    const [weighbridgeLogs] = await pool.query(
      'SELECT * FROM weighbridge_logs WHERE reference_type = "PO" AND reference_id = ? ORDER BY entry_time ASC',
      [id]
    );

    // 4. Get Quality Inspections linked to each weighbridge log
    let qualityInspections = [];
    if (weighbridgeLogs.length > 0) {
      const wbIds = weighbridgeLogs.map(w => w.id);
      const [qiRows] = await pool.query(
        'SELECT * FROM quality_inspections WHERE weighbridge_log_id IN (?) ORDER BY created_at ASC',
        [wbIds]
      );
      qualityInspections = qiRows;
    }

    // 5. Get GRNs
    const [grns] = await pool.query('SELECT * FROM grns WHERE purchase_order_id = ? ORDER BY created_at DESC', [id]);

    // 6. Get Quality Checks linked to GRNs (legacy path)
    let qualityChecks = [];
    if (grns.length > 0) {
      const grnIds = grns.map(g => g.id);
      const [qcRows] = await pool.query(
        'SELECT * FROM quality_checks WHERE reference_type = "grn" AND reference_id IN (?) ORDER BY created_at DESC',
        [grnIds]
      );
      qualityChecks = qcRows;
    }

    // 7. Get Finance Invoices
    const [invoices] = await pool.query(
      'SELECT * FROM finance_invoices WHERE order_type = "purchase" AND order_id = ? ORDER BY created_at DESC',
      [id]
    );

    // 8. Calculate summary
    const totalOrderedQty = poItems.reduce((sum, item) => sum + Number(item.quantity), 0);
    const totalReceivedWeight = weighbridgeLogs.reduce((sum, log) => sum + Number(log.net_weight || log.gross_weight || 0), 0);
    const totalInspected = qualityInspections.length;
    const totalApprovedInspections = qualityInspections.filter(qi => qi.status === 'Approved').length;
    const logsWithoutInspection = weighbridgeLogs.filter(
      wl => !qualityInspections.some(qi => qi.weighbridge_log_id === wl.id)
    );

    res.json({
      po,
      poItems,
      weighbridgeLogs,
      qualityInspections,
      grns,
      qualityChecks,
      invoices,
      summary: {
        totalOrderedQty,
        totalReceivedWeight,
        totalLoads: weighbridgeLogs.length,
        totalInspected,
        totalApprovedInspections,
        pendingInspectionCount: logsWithoutInspection.length,
        fullyReceived: totalReceivedWeight >= totalOrderedQty,
        fullyInspected: weighbridgeLogs.length > 0 && logsWithoutInspection.length === 0
      }
    });
  } catch (error) {
    console.error('Error fetching PO lifecycle:', error);
    res.status(500).json({ error: 'Failed to fetch PO lifecycle data' });
  }
};
