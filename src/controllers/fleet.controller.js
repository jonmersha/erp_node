import pool from '../db.js';
import crypto from 'node:crypto';

// --- Vehicles ---

export const getVehicles = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'Company ID required' });

    const [rows] = await pool.query('SELECT * FROM vehicles WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
    const mapped = rows.map(r => ({
      id: r.id,
      plateNumber: r.plate_number,
      make: r.make,
      model: r.model,
      type: r.type,
      status: r.status,
      companyId: r.company_id,
      createdAt: r.created_at
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createVehicle = async (req, res) => {
  try {
    const { plateNumber, make, model, type, companyId } = req.body;
    const id = crypto.randomUUID();

    await pool.query(
      'INSERT INTO vehicles (id, plate_number, make, model, type, company_id) VALUES (?, ?, ?, ?, ?, ?)',
      [id, plateNumber, make, model, type, companyId]
    );
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Vehicle Requests ---

export const getVehicleRequests = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'Company ID required' });

    const query = `
      SELECT r.*, e.name as employee_name, e.email as employee_email, v.plate_number,
      c.name as cost_center_name
      FROM vehicle_requests r 
      JOIN employees e ON r.employee_id = e.id 
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN cost_centers c ON r.cost_center_id = c.id
      WHERE r.company_id = ? 
      ORDER BY r.created_at DESC
    `;
    
    const [rows] = await pool.query(query, [companyId]);
    const mapped = rows.map(r => ({
      id: r.id,
      employeeId: r.employee_id,
      employeeName: r.employee_name,
      employeeEmail: r.employee_email,
      travelers: r.travelers || [],
      vehicleId: r.vehicle_id,
      vehiclePlate: r.plate_number,
      startDate: r.start_date,
      endDate: r.end_date,
      purpose: r.purpose,
      costCenterId: r.cost_center_id,
      costCenterName: r.cost_center_name,
      status: r.status,
      companyId: r.company_id,
      createdBy: r.created_by,
      approvedBy: r.approved_by,
      createdAt: r.created_at
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createVehicleRequest = async (req, res) => {
  try {
    const { employeeId, travelers, startDate, endDate, purpose, costCenterId, companyId, createdBy } = req.body;
    const id = crypto.randomUUID();

    await pool.query(
      'INSERT INTO vehicle_requests (id, employee_id, travelers, start_date, end_date, purpose, cost_center_id, company_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, employeeId, JSON.stringify(travelers || []), startDate, endDate, purpose, costCenterId || null, companyId, createdBy]
    );
    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveVehicleRequest = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { approverId, vehicleId } = req.body;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [requests] = await connection.query('SELECT * FROM vehicle_requests WHERE id = ?', [id]);
    if (requests.length === 0) throw new Error('Request not found');
    const request = requests[0];

    if (request.status !== 'pending_approval') throw new Error('Request is not in pending status');
    
    // Maker-Checker Rule check
    if (request.created_by === approverId) {
      throw new Error('Maker cannot be the checker. You cannot approve your own request.');
    }

    await connection.query(
      'UPDATE vehicle_requests SET status = ?, approved_by = ?, vehicle_id = ? WHERE id = ?',
      ['approved', approverId, vehicleId, id]
    );
    
    await connection.commit();
    res.json({ message: 'Request approved successfully' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const rejectVehicleRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId } = req.body;

    const [requests] = await pool.query('SELECT * FROM vehicle_requests WHERE id = ?', [id]);
    if (requests.length === 0) throw new Error('Request not found');
    const request = requests[0];

    if (request.status !== 'pending_approval') throw new Error('Request is not in pending status');

    await pool.query(
      'UPDATE vehicle_requests SET status = ?, approved_by = ? WHERE id = ?',
      ['rejected', approverId, id]
    );
    
    res.json({ message: 'Request rejected successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Fleet Consumptions ---

export const getFleetConsumptions = async (req, res) => {
  try {
    const { companyId, vehicleId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'Company ID required' });

    let query = `
      SELECT c.*, v.plate_number 
      FROM fleet_consumptions c 
      JOIN vehicles v ON c.vehicle_id = v.id 
      WHERE c.company_id = ? 
      ORDER BY c.date DESC
    `;
    const params = [companyId];
    
    if (vehicleId) {
      query = `
        SELECT c.*, v.plate_number 
        FROM fleet_consumptions c 
        JOIN vehicles v ON c.vehicle_id = v.id 
        WHERE c.company_id = ? AND c.vehicle_id = ? 
        ORDER BY c.date DESC
      `;
      params.push(vehicleId);
    }

    const [rows] = await pool.query(query, params);
    const mapped = rows.map(r => ({
      id: r.id,
      vehicleId: r.vehicle_id,
      vehiclePlate: r.plate_number,
      type: r.type,
      cost: parseFloat(r.cost),
      date: r.date,
      description: r.description,
      costCenterId: r.cost_center_id,
      companyId: r.company_id,
      recordedBy: r.recorded_by,
      createdAt: r.created_at
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createFleetConsumption = async (req, res) => {
  let connection;
  try {
    const { vehicleId, type, cost, date, description, costCenterId, companyId, recordedBy } = req.body;
    const id = crypto.randomUUID();

    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query(
      'INSERT INTO fleet_consumptions (id, vehicle_id, type, cost, date, description, cost_center_id, company_id, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, vehicleId, type, cost, date, description, costCenterId || null, companyId, recordedBy]
    );

    // If linked to a cost center, automatically log it as an expense (pending approval)
    if (costCenterId) {
      const expenseId = crypto.randomUUID();
      await connection.query(
        'INSERT INTO expenses (id, cost_center_id, amount, date, description, category, status, company_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [expenseId, costCenterId, cost, date, `Fleet ${type} consumption: ${description || ''}`, 'Fleet/Logistics', 'pending', companyId, recordedBy]
      );
    }

    await connection.commit();
    res.status(201).json({ id });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { plateNumber, make, model, type, status } = req.body;
    await pool.query(
      'UPDATE vehicles SET plate_number = ?, make = ?, model = ?, type = ?, status = ? WHERE id = ?',
      [plateNumber, make, model, type, status, id]
    );
    res.json({ message: 'Vehicle updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateVehicleRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { travelers, startDate, endDate, purpose, costCenterId } = req.body;
    
    // Only allow updating if it's pending (we can enforce this or let the frontend enforce it, 
    // but better to enforce here)
    const [rows] = await pool.query('SELECT status FROM vehicle_requests WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    if (rows[0].status !== 'pending_approval') return res.status(400).json({ error: 'Can only edit pending requests' });

    await pool.query(
      'UPDATE vehicle_requests SET travelers = ?, start_date = ?, end_date = ?, purpose = ?, cost_center_id = ? WHERE id = ?',
      [JSON.stringify(travelers || []), startDate, endDate, purpose, costCenterId || null, id]
    );
    res.json({ message: 'Vehicle request updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFleetConsumption = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleId, type, cost, date, description, costCenterId } = req.body;
    
    await pool.query(
      'UPDATE fleet_consumptions SET vehicle_id = ?, type = ?, cost = ?, date = ?, description = ?, cost_center_id = ? WHERE id = ?',
      [vehicleId, type, cost, date, description, costCenterId || null, id]
    );
    // Note: If costCenterId changed, we might need to update the associated expense. 
    // For simplicity, we just update the consumption. 
    res.json({ message: 'Consumption updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
