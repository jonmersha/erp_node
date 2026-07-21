import { v4 as uuidv4 } from 'uuid';
import pool from '../../../config/db.config.js';

// Get leave requests
export const getLeaves = async (req, res) => {
  const { company_id } = req.user;
  try {
    const [rows] = await pool.query(`
      SELECT l.*, e.name as employeeName, e.email as employeeEmail, e.role as employeeRole, a.name as approverName
      FROM leave_requests l
      JOIN employees e ON l.employee_id = e.id
      LEFT JOIN employees a ON l.approved_by = a.id
      WHERE l.company_id = ?
      ORDER BY l.created_at DESC
    `, [company_id]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ error: error.message });
  }
};

// Apply for leave
export const applyLeave = async (req, res) => {
  const { company_id } = req.user;
  const { employee_id, start_date, end_date, type, reason } = req.body;
  const id = uuidv4();

  try {
    await pool.query(
      'INSERT INTO leave_requests (id, employee_id, start_date, end_date, type, reason, status, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, employee_id, start_date, end_date, type, reason, 'pending', company_id]
    );
    res.status(201).json({ id, message: 'Leave request submitted successfully' });
  } catch (error) {
    console.error('Error applying for leave:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update leave status
export const updateLeaveStatus = async (req, res) => {
  const { company_id, uid } = req.user;
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'

  try {
    // Need an employee ID for the approver. Assuming the logged in user is the approver, we can just save their uid or null if they don't have an employee record.
    // Let's try to map the uid to an employee ID if possible, otherwise just leave it null for now.
    const [empRows] = await pool.query('SELECT id FROM employees WHERE email = (SELECT email FROM authdb.users WHERE uid = ?)', [uid]);
    const approverId = empRows.length > 0 ? empRows[0].id : null;

    const [leaveRows] = await pool.query('SELECT employee_id FROM leave_requests WHERE id = ?', [id]);
    if (leaveRows.length > 0 && leaveRows[0].employee_id === approverId) {
      return res.status(403).json({ error: 'Maker cannot be the checker. You cannot approve your own leave request.' });
    }

    await pool.query(
      'UPDATE leave_requests SET status = ?, approved_by = ? WHERE id = ? AND company_id = ?',
      [status, approverId, id, company_id]
    );
    res.json({ message: `Leave request ${status}` });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ error: error.message });
  }
};
