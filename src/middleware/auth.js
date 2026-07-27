import jwt from 'jsonwebtoken';
import pool from '../config/db.config.js';
import '../config/firebase.js'; // Ensure it initializes
import { getAuth } from 'firebase-admin/auth';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_dev_secret_key';
    
    let decodedToken;
    try {
      // First try to verify as a native Custom JWT
      decodedToken = jwt.verify(token, jwtSecret);
    } catch (err) {
      // If it fails, try verifying it as a Firebase ID token using firebase-admin
      try {
        decodedToken = await getAuth().verifyIdToken(token);
      } catch (firebaseErr) {
        console.error("Token verification failed (JWT & Firebase):", firebaseErr.message);
        throw new Error('Invalid or expired token');
      }
    }
    
    // Fetch user from DB to get company_id and roles
    let company_id = null;
    let roles = [];
    let unit_id = null;
    try {
      const { default: pool } = await import('../config/db.config.js');
      const [rows] = await pool.query('SELECT company_id, roles, unit_id FROM users WHERE uid = ?', [decodedToken.uid]);
      if (rows.length > 0) {
        company_id = rows[0].company_id;
        roles = typeof rows[0].roles === 'string' ? JSON.parse(rows[0].roles) : rows[0].roles;
        unit_id = rows[0].unit_id;
      }
    } catch (dbErr) {
      console.error('Error fetching user data in auth middleware:', dbErr);
    }
    
    // Attach user to req
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      company_id,
      roles,
      unit_id
    };
    
    next();
  } catch (error) {
    console.error('Custom JWT Auth Error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
