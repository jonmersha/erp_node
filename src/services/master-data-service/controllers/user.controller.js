import pool from '../../../config/db.config.js';

export const getErpUsers = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
    
    const [rows] = await pool.query('SELECT uid, email, name, roles, unit_id as unitId, company_id as companyId, status FROM users WHERE company_id = ?', [companyId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ERP users' });
  }
};

export const getErpUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM users WHERE uid = ?', [id]);
    if (rows.length > 0) {
      const user = rows[0];
      user.companyId = user.company_id;
      user.unitId = user.unit_id;
      res.json(user);
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ERP user' });
  }
};

export const createErpUser = async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email || req.body.email;
    const { name, roles, unit_id, unitId, company_id, companyId, status } = req.body;
    
    const finalUnitId = unit_id || unitId || null;
    const finalCompanyId = company_id || companyId || null;
    const finalStatus = status || 'active';
    
    // Convert roles to array if it's not
    const parsedRoles = Array.isArray(roles) ? roles : (roles ? [roles] : []);
    
    await pool.query(
      `INSERT INTO users (uid, email, name, roles, unit_id, company_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       email = VALUES(email), name = VALUES(name), company_id = VALUES(company_id), unit_id = VALUES(unit_id), roles = VALUES(roles), status = VALUES(status)`,
      [uid, email, name || '', JSON.stringify(parsedRoles), finalUnitId, finalCompanyId, finalStatus]
    );
    res.status(201).json({ uid });
  } catch (error) {
    console.error('Create ERP user error:', error);
    res.status(500).json({ error: 'Failed to create ERP user', details: error.message });
  }
};

export const updateErpUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, roles, unit_id, unitId, company_id, companyId, status } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM users WHERE uid = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'ERP User not found' });
    }
    
    const currentUser = existing[0];
    
    const finalEmail = email !== undefined ? email : currentUser.email;
    const finalName = name !== undefined ? name : currentUser.name;
    const finalRoles = roles !== undefined ? roles : currentUser.roles;
    const finalUnitId = unit_id !== undefined ? unit_id : (unitId !== undefined ? unitId : currentUser.unit_id);
    const finalCompanyId = company_id !== undefined ? company_id : (companyId !== undefined ? companyId : currentUser.company_id);
    const finalStatus = status !== undefined ? status : currentUser.status;
    
    await pool.query(
      'UPDATE users SET email = ?, name = ?, roles = ?, unit_id = ?, company_id = ?, status = ? WHERE uid = ?',
      [finalEmail, finalName, JSON.stringify(finalRoles), finalUnitId, finalCompanyId, finalStatus, id]
    );

    res.json({ message: 'ERP User updated' });
  } catch (error) {
    console.error('Update ERP user error:', error);
    res.status(500).json({ error: 'Failed to update ERP user', details: error.message });
  }
};

export const deleteErpUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE uid = ?', [id]);
    res.json({ message: 'ERP User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ERP user' });
  }
};
