import pool from '../../../config/db.config.js';
import crypto from 'crypto';

export const getJournalEntries = async (req, res) => {
  try {
    const { companyId, startDate, endDate, accountType } = req.query;
    if (!companyId) return res.status(400).json({ error: 'Company ID is required' });

    let query = `
      SELECT id, date, account_type as accountType, amount, entry_type as entryType, 
             reference_type as referenceType, reference_id as referenceId, 
             description, created_at as createdAt 
      FROM journal_entries 
      WHERE company_id = ?
    `;
    const params = [companyId];

    if (startDate) {
      query += ` AND date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date <= ?`;
      params.push(endDate);
    }
    if (accountType) {
      query += ` AND account_type = ?`;
      params.push(accountType);
    }

    query += ` ORDER BY date DESC, created_at DESC`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
};

export const createManualJournalEntry = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { companyId, date, description, entries } = req.body;

    if (!companyId || !date || !entries || entries.length < 2) {
      return res.status(400).json({ error: 'Invalid payload. At least two entries required.' });
    }

    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach(e => {
      const amount = parseFloat(e.amount);
      if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount');
      if (e.entryType === 'debit') totalDebit += amount;
      else if (e.entryType === 'credit') totalCredit += amount;
      else throw new Error('Invalid entryType. Must be debit or credit');
    });

    // Check balancing
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return res.status(400).json({ error: 'Total debits must equal total credits' });
    }

    const referenceId = crypto.randomUUID();

    for (const entry of entries) {
      const id = crypto.randomUUID();
      await connection.query(
        `INSERT INTO journal_entries 
         (id, date, account_type, amount, entry_type, reference_type, reference_id, description, company_id)
         VALUES (?, ?, ?, ?, ?, 'manual', ?, ?, ?)`,
        [id, date, entry.accountType, parseFloat(entry.amount), entry.entryType, referenceId, description || 'Manual Entry', companyId]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, referenceId, totalAmount: totalDebit });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating journal entry:', error);
    res.status(500).json({ error: error.message || 'Failed to create journal entry' });
  } finally {
    connection.release();
  }
};
