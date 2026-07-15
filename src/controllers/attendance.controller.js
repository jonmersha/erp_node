import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';

// Get attendance records
export const getAttendance = async (req, res) => {
  const { company_id } = req.user;
  try {
    const [rows] = await pool.query(`
      SELECT a.*, e.name as employeeName, e.role as employeeRole 
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.company_id = ?
      ORDER BY a.date DESC, a.clock_in DESC
    `, [company_id]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: error.message });
  }
};

// Clock in / Add manual attendance
export const logAttendance = async (req, res) => {
  const { company_id } = req.user;
  const { employee_id, date, clock_in, clock_out, status, overtime_hours } = req.body;
  const id = uuidv4();

  try {
    // Check if record exists for this employee on this date
    const [existing] = await pool.query('SELECT * FROM attendance WHERE employee_id = ? AND date = ?', [employee_id, date]);
    
    if (existing.length > 0) {
      // Update
      const attId = existing[0].id;
      await pool.query(
        'UPDATE attendance SET clock_in = COALESCE(?, clock_in), clock_out = COALESCE(?, clock_out), status = COALESCE(?, status), overtime_hours = COALESCE(?, overtime_hours) WHERE id = ?',
        [clock_in, clock_out, status, overtime_hours, attId]
      );
      res.json({ id: attId, message: 'Attendance updated' });
    } else {
      // Create
      await pool.query(
        'INSERT INTO attendance (id, employee_id, date, clock_in, clock_out, status, overtime_hours, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, employee_id, date, clock_in || null, clock_out || null, status || 'present', overtime_hours || 0, company_id]
      );
      res.status(201).json({ id, message: 'Attendance logged' });
    }
  } catch (error) {
    console.error('Error logging attendance:', error);
    res.status(500).json({ error: error.message });
  }
};
