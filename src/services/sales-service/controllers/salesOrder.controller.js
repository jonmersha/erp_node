import pool from '../../../db.js';
import crypto from 'node:crypto';

export const getAllSalesOrders = async (req, res) => {
  try {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sales_order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id CHAR(36) NOT NULL,
          product_id CHAR(36) NOT NULL,
          product_name VARCHAR(255),
          quantity DECIMAL(12, 2) NOT NULL,
          price DECIMAL(12, 2) NOT NULL
        )
      `);
    } catch(e) {}

    const { companyId } = req.query;
    let query = 'SELECT * FROM sales_orders';
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
      const [items] = await pool.query('SELECT * FROM sales_order_items WHERE order_id IN (?)', [orderIds]);
      for (const item of items) {
        if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
        itemsByOrderId[item.order_id].push({
          productId: item.product_id,
          productName: item.product_name,
          quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
        });
      }
    }

    // map snake_case to camelCase
    const mappedRows = rows.map(row => ({
      ...row,
      companyId: row.company_id,
      customerId: row.customer_id,
      outletId: row.outlet_id,
      totalAmount: row.total_amount,
      items: itemsByOrderId[row.id] || [],
      createdAt: row.created_at
    }));
    res.json(mappedRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales orders' });
  }
};

export const createSalesOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { 
      id, 
      customerId, customer_id, 
      outletId, outlet_id, 
      status, 
      totalAmount, total_amount, 
      companyId, company_id,
      items 
    } = req.body;

    const finalCompanyId = companyId || company_id;
    if (!finalCompanyId) {
      await connection.rollback();
      return res.status(400).json({ error: 'companyId is required' });
    }

    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS sales_order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id CHAR(36) NOT NULL,
          product_id CHAR(36) NOT NULL,
          product_name VARCHAR(255),
          quantity DECIMAL(12, 2) NOT NULL,
          price DECIMAL(12, 2) NOT NULL
        )
      `);
    } catch(e) {}

    const orderId = id || crypto.randomUUID();
    const finalCustomerId = customerId || customer_id;
    const finalOutletId = outletId || outlet_id;
    const finalTotalAmount = totalAmount || total_amount;

    await connection.query(
      'INSERT INTO sales_orders (id, customer_id, outlet_id, status, total_amount, company_id) VALUES (?, ?, ?, ?, ?, ?)',
      [orderId, finalCustomerId, finalOutletId, status || 'draft', finalTotalAmount || 0, finalCompanyId]
    );

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await connection.query(
          'INSERT INTO sales_order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.productId || item.product_id, item.productName || item.product_name, item.quantity, item.price]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ id: orderId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating sales order:', error);
    res.status(500).json({ error: 'Failed to create sales order', details: error.message });
  } finally {
    connection.release();
  }
};

export const updateSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      customerId, customer_id, 
      outletId, outlet_id, 
      status, 
      totalAmount, total_amount 
    } = req.body;

    const finalCustomerId = customerId || customer_id;
    const finalOutletId = outletId || outlet_id;
    const finalTotalAmount = totalAmount || total_amount;

    await pool.query(
      'UPDATE sales_orders SET customer_id = ?, outlet_id = ?, status = ?, total_amount = ? WHERE id = ?',
      [finalCustomerId, finalOutletId, status, finalTotalAmount, id]
    );
    res.json({ message: 'Sales order updated' });
  } catch (error) {
    console.error('Error updating sales order:', error);
    res.status(500).json({ error: 'Failed to update sales order', details: error.message });
  }
};

export const deleteSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM sales_orders WHERE id = ?', [id]);
    res.json({ message: 'Sales order deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sales order' });
  }
};
