import pool from '../../../db.js';
import crypto from 'node:crypto';

export const getInventory = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM inventory';
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
      unitId: row.unit_id,
      itemId: row.item_id,
      itemType: row.item_type === 'material' ? 'raw' : row.item_type,
      batchNumber: row.batch_number,
      expiryDate: row.expiry_date
    }));
    res.json(mappedRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

export const createInventory = async (req, res) => {
  try {
    const { 
      id, 
      unitId, unit_id, 
      itemId, item_id, 
      itemType, item_type, 
      quantity, 
      batchNumber, batch_number, 
      expiryDate, expiry_date, 
      companyId, company_id 
    } = req.body;
    
    const inventoryId = id || crypto.randomUUID();
    const finalExpiryDate = expiryDate || expiry_date;
    const formattedExpiryDate = finalExpiryDate ? new Date(finalExpiryDate).toISOString().split('T')[0] : null;

    let dbItemType = itemType || item_type;
    if (dbItemType === 'raw') dbItemType = 'material';

    await pool.query(
      'INSERT INTO inventory (id, unit_id, item_id, item_type, quantity, batch_number, expiry_date, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [inventoryId, unitId || unit_id, itemId || item_id, dbItemType, quantity, batchNumber || batch_number, formattedExpiryDate, companyId || company_id]
    );
    res.status(201).json({ id: inventoryId });
  } catch (error) {
    console.error('Inventory create error', error);
    res.status(500).json({ error: 'Failed to add inventory item', details: error.message });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      unitId, unit_id, 
      itemId, item_id, 
      itemType, item_type, 
      quantity, 
      batchNumber, batch_number, 
      expiryDate, expiry_date 
    } = req.body;
    
    // fetch existing
    const [existing] = await pool.query('SELECT * FROM inventory WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({error: 'Not found'});
    const current = existing[0];
    
    const finalExpiryDate = expiryDate || expiry_date || current.expiry_date;
    const formattedExpiryDate = finalExpiryDate ? new Date(finalExpiryDate).toISOString().split('T')[0] : null;

    let dbItemType = itemType || item_type || current.item_type;
    if (dbItemType === 'raw') dbItemType = 'material';

    await pool.query(
      'UPDATE inventory SET unit_id = ?, item_id = ?, item_type = ?, quantity = ?, batch_number = ?, expiry_date = ? WHERE id = ?',
      [
        unitId || unit_id || current.unit_id, 
        itemId || item_id || current.item_id, 
        dbItemType, 
        quantity !== undefined ? quantity : current.quantity, 
        batchNumber || batch_number || current.batch_number, 
        formattedExpiryDate, 
        id
      ]
    );
    res.json({ message: 'Inventory item updated' });
  } catch (error) {
    console.error('Inventory update error', error);
    res.status(500).json({ error: 'Failed to update inventory item', details: error.message });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM inventory WHERE id = ?', [id]);
    res.json({ message: 'Inventory item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
};

export const receivePurchaseOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { selectedPO, warehouseId, notes, profile } = req.body;
    
    // Create GRN
    const grnId = crypto.randomUUID();
    await connection.query(
      "INSERT INTO grns (id, purchase_order_id, warehouse_id, receipt_date, status, company_id) VALUES (?, ?, ?, NOW(), 'received', ?)",
      [grnId, selectedPO.id, warehouseId, selectedPO.companyId]
    );

    // Update PO Status
    await connection.query("UPDATE purchase_orders SET status = 'received' WHERE id = ?", [selectedPO.id]);

    // Fetch PO items
    const [poItems] = await connection.query("SELECT * FROM purchase_order_items WHERE order_id = ?", [selectedPO.id]);
    
    for (const item of poItems) {
      // Find existing inventory item or insert new
      const [inv] = await connection.query(
        "SELECT * FROM inventory WHERE unit_id = ? AND item_id = ? AND item_type = 'material'",
        [warehouseId, item.item_id]
      );
      
      let invId;
      if (inv.length > 0) {
        invId = inv[0].id;
        await connection.query(
          "UPDATE inventory SET quantity = quantity + ? WHERE id = ?",
          [item.quantity, invId]
        );
      } else {
        invId = crypto.randomUUID();
        await connection.query(
          "INSERT INTO inventory (id, unit_id, item_id, item_type, quantity, company_id) VALUES (?, ?, ?, 'material', ?, ?)",
          [invId, warehouseId, item.item_id, item.quantity, selectedPO.companyId]
        );
      }

      // Record transaction
      const txId = crypto.randomUUID();
      await connection.query(
        "INSERT INTO inventory_transactions (id, inventory_id, item_id, item_type, transaction_type, quantity, reference_id, reference_type, notes, user_id, company_id) VALUES (?, ?, ?, 'material', 'in', ?, ?, 'grn', ?, ?, ?)",
        [txId, invId, item.item_id, item.quantity, grnId, notes, profile?.uid, selectedPO.companyId]
      );
    }
    
    await connection.commit();
    res.json({ message: 'PO Received Successfully', grnId });
  } catch (error) {
    await connection.rollback();
    console.error('Receive PO error:', error);
    res.status(500).json({ error: 'Failed to receive PO', details: error.message });
  } finally {
    connection.release();
  }
};

export const shipSalesOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { selectedSO, warehouseId, notes, profile } = req.body;
    
    // Create DN
    const dnId = crypto.randomUUID();
    await connection.query(
      "INSERT INTO delivery_notes (id, sales_order_id, outlet_id, dispatch_date, status, company_id) VALUES (?, ?, ?, NOW(), 'dispatched', ?)",
      [dnId, selectedSO.id, warehouseId, selectedSO.companyId]
    ); // Mapping outlet_id to warehouseId for now as per frontend

    // Update SO Status
    await connection.query("UPDATE sales_orders SET status = 'shipped' WHERE id = ?", [selectedSO.id]);

    // Fetch SO items
    const [soItems] = await connection.query("SELECT * FROM sales_order_items WHERE order_id = ?", [selectedSO.id]);
    
    for (const item of soItems) {
      // Find existing inventory item
      const [inv] = await connection.query(
        "SELECT * FROM inventory WHERE unit_id = ? AND item_id = ? AND item_type = 'product'",
        [warehouseId, item.item_id]
      );
      
      if (inv.length > 0 && inv[0].quantity >= item.quantity) {
        const invId = inv[0].id;
        await connection.query(
          "UPDATE inventory SET quantity = quantity - ? WHERE id = ?",
          [item.quantity, invId]
        );
        
        // Record transaction
        const txId = crypto.randomUUID();
        await connection.query(
          "INSERT INTO inventory_transactions (id, inventory_id, item_id, item_type, transaction_type, quantity, reference_id, reference_type, notes, user_id, company_id) VALUES (?, ?, ?, 'product', 'out', ?, ?, 'delivery_note', ?, ?, ?)",
          [txId, invId, item.item_id, item.quantity, dnId, notes, profile?.uid, selectedSO.companyId]
        );
      } else {
        throw new Error(`Insufficient inventory for item ${item.item_id} in warehouse ${warehouseId}`);
      }
    }
    
    await connection.commit();
    res.json({ message: 'SO Shipped Successfully', dnId });
  } catch (error) {
    await connection.rollback();
    console.error('Ship SO error:', error);
    res.status(500).json({ error: 'Failed to ship SO', details: error.message });
  } finally {
    connection.release();
  }
};

export const transferProduction = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { productId, quantity, warehouseId, profile } = req.body;
    
    const [inv] = await connection.query(
      "SELECT * FROM inventory WHERE unit_id = ? AND item_id = ? AND item_type = 'product'",
      [warehouseId, productId]
    );
    
    let invId;
    if (inv.length > 0) {
      invId = inv[0].id;
      await connection.query(
        "UPDATE inventory SET quantity = quantity + ? WHERE id = ?",
        [quantity, invId]
      );
    } else {
      invId = crypto.randomUUID();
      await connection.query(
        "INSERT INTO inventory (id, unit_id, item_id, item_type, quantity, company_id) VALUES (?, ?, ?, 'product', ?, ?)",
        [invId, warehouseId, productId, quantity, profile?.companyId]
      );
    }

    const txId = crypto.randomUUID();
    await connection.query(
      "INSERT INTO inventory_transactions (id, inventory_id, item_id, item_type, transaction_type, quantity, reference_type, notes, user_id, company_id) VALUES (?, ?, ?, 'product', 'in', ?, 'production_run', 'Finished goods received', ?, ?)",
      [txId, invId, productId, quantity, profile?.uid, profile?.companyId]
    );
    
    await connection.commit();
    res.json({ message: 'Production transferred successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Transfer Production error:', error);
    res.status(500).json({ error: 'Failed to transfer production', details: error.message });
  } finally {
    connection.release();
  }
};
