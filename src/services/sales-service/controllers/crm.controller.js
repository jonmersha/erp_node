import pool from '../../../db.js';
import crypto from 'node:crypto';

// Customers
export const getCustomers = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = 'SELECT * FROM customers';
    let params = [];
    if (companyId) {
      query += ' WHERE company_id = ?';
      params.push(companyId);
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const { id, name, phone, email, address, company_id, companyId } = req.body;
    const customerId = id || crypto.randomUUID();
    const finalCompanyId = company_id || companyId;
    await pool.query(
      'INSERT INTO customers (id, name, phone, email, address, company_id) VALUES (?, ?, ?, ?, ?, ?)',
      [customerId, name, phone || null, email || null, address || null, finalCompanyId]
    );
    res.status(201).json({ id: customerId });
  } catch (error) {
    console.error('Customer creation error:', error);
    res.status(500).json({ error: 'Failed to create customer', details: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;
    await pool.query(
      'UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
      [name, phone || null, email || null, address || null, id]
    );
    res.json({ message: 'Customer updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};

// Tickets
export const getTickets = async (req, res) => {
  try {
    const { companyId, customerId } = req.query;
    let query = 'SELECT * FROM crm_tickets WHERE 1=1';
    let params = [];
    if (companyId) {
      query += ' AND company_id = ?';
      params.push(companyId);
    }
    if (customerId) {
      query += ' AND customer_id = ?';
      params.push(customerId);
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

export const createTicket = async (req, res) => {
  try {
    const { id, customer_id, customerId, type, status, resolution_notes, resolutionNotes, company_id, companyId } = req.body;
    const ticketId = id || crypto.randomUUID();
    const finalCompanyId = company_id || companyId;
    const finalCustomerId = customer_id || customerId;
    const finalNotes = resolution_notes || resolutionNotes || null;
    await pool.query(
      'INSERT INTO crm_tickets (id, customer_id, type, status, resolution_notes, company_id) VALUES (?, ?, ?, ?, ?, ?)',
      [ticketId, finalCustomerId, type || 'inquiry', status || 'open', finalNotes, finalCompanyId]
    );
    res.status(201).json({ id: ticketId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes, resolutionNotes } = req.body;
    const finalNotes = resolutionNotes !== undefined ? resolutionNotes : (resolution_notes || null);
    await pool.query(
      'UPDATE crm_tickets SET status = ?, resolution_notes = ? WHERE id = ?',
      [status, finalNotes, id]
    );
    res.json({ message: 'Ticket updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
};

// Interactions
export const getInteractions = async (req, res) => {
  try {
    const { companyId, customerId } = req.query;
    let query = 'SELECT * FROM customer_interactions WHERE 1=1';
    let params = [];
    if (companyId) {
      query += ' AND company_id = ?';
      params.push(companyId);
    }
    if (customerId) {
      query += ' AND customer_id = ?';
      params.push(customerId);
    }
    query += ' ORDER BY interaction_date DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
};

export const createInteraction = async (req, res) => {
  try {
    const { id, customer_id, customerId, interaction_type, interactionType, notes, user_id, userId, company_id, companyId } = req.body;
    const interactionId = id || crypto.randomUUID();
    const finalCompanyId = company_id || companyId;
    const finalCustomerId = customer_id || customerId;
    const finalType = interactionType || interaction_type || 'general';
    const finalUserId = userId || user_id || null;
    await pool.query(
      'INSERT INTO customer_interactions (id, customer_id, interaction_type, notes, user_id, company_id) VALUES (?, ?, ?, ?, ?, ?)',
      [interactionId, finalCustomerId, finalType, notes, finalUserId, finalCompanyId]
    );
    res.status(201).json({ id: interactionId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create interaction' });
  }
};
