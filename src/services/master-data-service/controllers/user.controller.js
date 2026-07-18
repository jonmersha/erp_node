import pool from '../../../db.js';
import crypto from 'node:crypto';
import { syncLogToRemote } from '../../../utils/auditLogger.js';

export const getUsers = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
    
    const [rows] = await pool.query('SELECT uid, email, name, roles, unit_id as unitId, company_id as companyId, status FROM users WHERE company_id = ?', [companyId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM users WHERE uid = ?', [id]);
    if (rows.length > 0) {
      const user = rows[0];
      // map snake_case to camelCase
      user.companyId = user.company_id;
      user.unitId = user.unit_id;
      res.json(user);
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { uid, email, name, roles, unit_id, unitId, company_id, companyId, status } = req.body;
    const finalUnitId = unit_id || unitId || null;
    const finalCompanyId = company_id || companyId || null;
    const finalStatus = status || 'active';
    
    await pool.query(
      `INSERT INTO users (uid, email, name, roles, unit_id, company_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       email = VALUES(email), name = VALUES(name), company_id = VALUES(company_id), status = VALUES(status)`,
      [uid, email, name, JSON.stringify(roles), finalUnitId, finalCompanyId, finalStatus]
    );
    res.status(201).json({ uid });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, roles, unit_id, unitId, company_id, companyId, status, performedBy } = req.body;
    
    // 1. Fetch current user to compare roles and fallback for missing fields
    const [existing] = await pool.query('SELECT * FROM users WHERE uid = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentUser = existing[0];
    
    const finalEmail = email !== undefined ? email : currentUser.email;
    const finalName = name !== undefined ? name : currentUser.name;
    const finalRoles = roles !== undefined ? roles : currentUser.roles;
    const finalUnitId = unit_id !== undefined ? unit_id : (unitId !== undefined ? unitId : currentUser.unit_id);
    const finalCompanyId = company_id !== undefined ? company_id : (companyId !== undefined ? companyId : currentUser.company_id);
    const finalStatus = status !== undefined ? status : currentUser.status;
    
    // 2. Perform the update
    await pool.query(
      'UPDATE users SET email = ?, name = ?, roles = ?, unit_id = ?, company_id = ?, status = ? WHERE uid = ?',
      [finalEmail, finalName, JSON.stringify(finalRoles), finalUnitId, finalCompanyId, finalStatus, id]
    );

    // 3. Check for role changes and log if they differ
    if (existing.length > 0 && performedBy) {
      const oldRoles = existing[0].roles ? (typeof existing[0].roles === 'string' ? JSON.parse(existing[0].roles) : existing[0].roles) : [];
      
      const oldRolesStr = Array.isArray(oldRoles) ? oldRoles.sort().join(',') : '';
      const newRolesStr = Array.isArray(finalRoles) ? finalRoles.sort().join(',') : '';

      if (oldRolesStr !== newRolesStr && roles !== undefined) {
        const description = `Roles changed from [${oldRolesStr || 'none'}] to [${newRolesStr || 'none'}]`;
        
        // Insert into audit_logs
        await pool.query(
          `INSERT INTO audit_logs (entity_type, entity_id, action, description, performed_by, company_id) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          ['user_roles', id, 'UPDATE_ROLES', description, performedBy, finalCompanyId]
        );

        // Async dispatch to remote server
        syncLogToRemote({
          entity_type: 'user_roles',
          entity_id: id,
          action: 'UPDATE_ROLES',
          description,
          performed_by: performedBy,
          company_id: finalCompanyId,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({ message: 'User updated' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('DELETE FROM users WHERE uid = ?', [id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
