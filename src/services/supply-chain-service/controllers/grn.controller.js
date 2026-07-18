import pool from '../../../db.js';
import crypto from 'node:crypto';

export const getAllGRNs = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM grns';
    let params = [];
    if (companyId) {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    const [rows] = await pool.query(query, params);
    
    // map snake_case to camelCase
    const mappedRows = rows.map(row => ({
      ...row,
      purchaseOrderId: row.purchase_order_id,
      warehouseId: row.warehouse_id,
      receiptDate: row.receipt_date,
      companyId: row.company_id,
      createdAt: row.created_at
    }));
    
    res.json(mappedRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GRNs' });
  }
};

export const createGRN = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { 
      purchaseOrderId, purchase_order_id, 
      warehouseId, warehouse_id, 
      receiptDate, receipt_date, 
      status, 
      companyId, company_id,
      items,
      userId
    } = req.body;
    
    const finalPurchaseOrderId = purchaseOrderId || purchase_order_id;
    const finalWarehouseId = warehouseId || warehouse_id;
    const finalReceiptDate = receiptDate || receipt_date;
    const finalCompanyId = companyId || company_id;

    if (!finalPurchaseOrderId || !finalWarehouseId || !finalCompanyId) {
      throw new Error('Missing required fields: purchaseOrderId, warehouseId, companyId');
    }

    const id = crypto.randomUUID();
    const formattedReceiptDate = finalReceiptDate ? new Date(finalReceiptDate).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');

    // 1. Create GRN
    await connection.query(
      'INSERT INTO grns (id, purchase_order_id, warehouse_id, receipt_date, status, company_id) VALUES (?, ?, ?, ?, ?, ?)',
      [id, finalPurchaseOrderId, finalWarehouseId, formattedReceiptDate, status || 'received', finalCompanyId]
    );

    // 2. Resolve items
    let receivedItems = items;
    if (!receivedItems || receivedItems.length === 0) {
      // Fallback: receive everything from PO
      const [poItems] = await connection.query(
        'SELECT item_id as itemId, quantity, price FROM purchase_order_items WHERE order_id = ?',
        [finalPurchaseOrderId]
      );
      receivedItems = poItems;
    }

    if (!receivedItems || receivedItems.length === 0) {
      throw new Error('No items to receive from PO');
    }

    let totalValue = 0;

    // Process each item
    for (const item of receivedItems) {
      const grnItemId = crypto.randomUUID();
      const quantity = Number(item.quantity);
      const price = Number(item.price || 0);
      totalValue += quantity * price;

      // 3. Insert grn_items
      await connection.query(
        'INSERT INTO grn_items (id, grn_id, item_id, quantity, price, company_id) VALUES (?, ?, ?, ?, ?, ?)',
        [grnItemId, id, item.itemId, quantity, price, finalCompanyId]
      );

      // 4. Update Inventory
      const [existingInv] = await connection.query(
        'SELECT id, quantity FROM inventory WHERE unit_id = ? AND item_id = ? AND company_id = ?',
        [finalWarehouseId, item.itemId, finalCompanyId]
      );

      let inventoryId;
      if (existingInv.length > 0) {
        inventoryId = existingInv[0].id;
        await connection.query(
          'UPDATE inventory SET quantity = quantity + ? WHERE id = ?',
          [quantity, inventoryId]
        );
      } else {
        inventoryId = crypto.randomUUID();
        await connection.query(
          'INSERT INTO inventory (id, unit_id, item_id, item_type, quantity, company_id) VALUES (?, ?, ?, ?, ?, ?)',
          [inventoryId, finalWarehouseId, item.itemId, 'material', quantity, finalCompanyId]
        );
      }

      // 5. Insert Inventory Transaction
      const transactionId = crypto.randomUUID();
      await connection.query(
        'INSERT INTO inventory_transactions (id, inventory_id, item_id, item_type, transaction_type, quantity, reference_id, reference_type, user_id, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [transactionId, inventoryId, item.itemId, 'material', 'in', quantity, id, 'grn', userId || 'system', finalCompanyId]
      );
    }

    // 6. Finance: Journal Entry
    if (totalValue > 0) {
      const journalEntryId1 = crypto.randomUUID(); // Debit Inventory
      const journalEntryId2 = crypto.randomUUID(); // Credit Accounts Payable
      
      await connection.query(
        'INSERT INTO journal_entries (id, date, account_type, amount, entry_type, reference_type, reference_id, description, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [journalEntryId1, formattedReceiptDate, 'inventory', totalValue, 'debit', 'grn', id, `GRN Receipt for PO ${finalPurchaseOrderId}`, finalCompanyId]
      );

      await connection.query(
        'INSERT INTO journal_entries (id, date, account_type, amount, entry_type, reference_type, reference_id, description, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [journalEntryId2, formattedReceiptDate, 'accounts_payable', totalValue, 'credit', 'grn', id, `GRN Liability for PO ${finalPurchaseOrderId}`, finalCompanyId]
      );
    }

    // 7. Update PO Status
    await connection.query(
      'UPDATE purchase_orders SET status = ? WHERE id = ?',
      ['received', finalPurchaseOrderId]
    );

    await connection.commit();
    res.status(201).json({ id, message: 'GRN created successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Create GRN transaction error:', error);
    res.status(500).json({ error: 'Failed to create GRN', details: error.message });
  } finally {
    connection.release();
  }
};
