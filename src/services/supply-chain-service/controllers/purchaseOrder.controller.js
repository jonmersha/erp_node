import pool from '../../../db.js';
import crypto from 'node:crypto';

export const getAllPurchaseOrders = async (req, res) => {
  try {
    try {
      await pool.query('ALTER TABLE purchase_orders ADD COLUMN warehouse_id CHAR(36) AFTER factory_id');
      await pool.query('ALTER TABLE purchase_orders MODIFY COLUMN factory_id CHAR(36) NULL');
    } catch(e) {}
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS purchase_order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id CHAR(36) NOT NULL,
          item_id CHAR(36) NOT NULL,
          item_name VARCHAR(255),
          quantity DECIMAL(12, 2) NOT NULL,
          price DECIMAL(12, 2) NOT NULL
        )
      `);
    } catch(e) {}

    const { companyId } = req.query;
    let query = 'SELECT * FROM purchase_orders';
    let params = [];
    if (companyId) {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    const [rows] = await pool.query(query, params);
    
    // Fetch items selectively: only query items associated with the retrieved orders!
    const itemsByOrderId = {};
    if (rows.length > 0) {
      const orderIds = rows.map(r => r.id);
      const [items] = await pool.query('SELECT * FROM purchase_order_items WHERE order_id IN (?)', [orderIds]);
      for (const item of items) {
        if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
        itemsByOrderId[item.order_id].push({
          itemId: item.item_id,
          itemName: item.item_name,
          quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
        });
      }
    }

    // map snake_case to camelCase
    const mappedRows = rows.map(row => ({
      ...row,
      companyId: row.company_id,
      supplierId: row.supplier_id,
      factoryId: row.factory_id,
      warehouseId: row.warehouse_id || null,
      totalAmount: row.total_amount,
      items: itemsByOrderId[row.id] || [],
      createdBy: row.created_by,
      approvedBy: row.approved_by,
      createdAt: row.created_at
    }));
    res.json(mappedRows);
  } catch (error) {
    console.error("Failed to fetch purchase orders", error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
};

export const createPurchaseOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { 
      id, 
      supplierId, supplier_id, 
      factoryId, factory_id,
      warehouseId, warehouse_id,
      status, 
      totalAmount, total_amount, 
      companyId, company_id,
      createdBy,
      items 
    } = req.body;

    const orderId = id || crypto.randomUUID();
    const finalSupplierId = supplierId || supplier_id;
    const finalFactoryId = factoryId || factory_id;
    const finalWarehouseId = warehouseId || warehouse_id;
    const finalTotalAmount = totalAmount || total_amount;
    const finalCompanyId = companyId || company_id;

    console.log('Attempting to create purchase order:', { orderId, supplierId: finalSupplierId, companyId: finalCompanyId });

    if (!finalCompanyId || !finalSupplierId) {
      console.error('Missing required fields for PO creation');
      return res.status(400).json({ error: 'companyId and supplierId are required' });
    }

    try {
      await connection.query('ALTER TABLE purchase_orders ADD COLUMN warehouse_id CHAR(36) AFTER factory_id');
      await connection.query('ALTER TABLE purchase_orders MODIFY COLUMN factory_id CHAR(36) NULL');
    } catch(e) {} // Ignore if column already exists

    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS purchase_order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id CHAR(36) NOT NULL,
          item_id CHAR(36) NOT NULL,
          item_name VARCHAR(255),
          quantity DECIMAL(12, 2) NOT NULL,
          price DECIMAL(12, 2) NOT NULL
        )
      `);
    } catch(e) {
      console.error("Could not create purchase_order_items", e);
    }

    await connection.query(
      'INSERT INTO purchase_orders (id, supplier_id, factory_id, warehouse_id, status, total_amount, company_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [orderId, finalSupplierId, finalFactoryId || null, finalWarehouseId || null, status || 'pending_approval', finalTotalAmount, finalCompanyId, createdBy || null]
    );

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await connection.query(
          'INSERT INTO purchase_order_items (order_id, item_id, item_name, quantity, price) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.itemId || item.item_id, item.itemName || item.item_name, item.quantity, item.price]
        );
      }
    }

    await connection.commit();
    console.log('Purchase order created successfully:', orderId);
    res.status(201).json({ id: orderId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order', details: error.message });
  } finally {
    connection.release();
  }
};

export const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      supplierId, supplier_id, 
      factoryId, factory_id, 
      warehouseId, warehouse_id, 
      status, 
      totalAmount, total_amount 
    } = req.body;

    const finalSupplierId = supplierId || supplier_id;
    const finalFactoryId = factoryId || factory_id;
    const finalWarehouseId = warehouseId || warehouse_id;
    const finalTotalAmount = totalAmount || total_amount;

    try {
      await pool.query('ALTER TABLE purchase_orders ADD COLUMN warehouse_id CHAR(36) AFTER factory_id');
      await pool.query('ALTER TABLE purchase_orders MODIFY COLUMN factory_id CHAR(36) NULL');
    } catch(e) {}

    await pool.query(
      'UPDATE purchase_orders SET supplier_id = ?, factory_id = ?, warehouse_id = ?, status = ?, total_amount = ? WHERE id = ?',
      [finalSupplierId, finalFactoryId || null, finalWarehouseId || null, status, finalTotalAmount, id]
    );
    res.json({ message: 'Purchase order updated' });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
};

export const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM purchase_orders WHERE id = ?', [id]);
    res.json({ message: 'Purchase order deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
};

export const approvePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId } = req.body;

    const [orders] = await pool.query('SELECT created_by FROM purchase_orders WHERE id = ?', [id]);
    if (orders.length === 0) return res.status(404).json({ error: 'Purchase order not found' });
    
    if (orders[0].created_by === approverId) {
      return res.status(403).json({ error: 'Maker cannot be the checker. You cannot approve this purchase order.' });
    }

    await pool.query(
      'UPDATE purchase_orders SET status = ?, approved_by = ? WHERE id = ?',
      ['approved', approverId, id]
    );
    res.json({ message: 'Purchase order approved successfully' });
  } catch (error) {
    console.error('Error approving purchase order:', error);
    res.status(500).json({ error: 'Failed to approve purchase order' });
  }
};
