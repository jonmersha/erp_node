import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';
import pool from '../config/db.config.js';

// Initialize Firebase Admin with just the projectId (sufficient for verifying ID tokens)
initializeApp({
  projectId: "sheger-systems",
});

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Attach user to req
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
    
    // Add company_id from authdb if user exists
    try {
      const [rows] = await pool.query('SELECT company_id FROM authdb.users WHERE uid = ?', [decodedToken.uid]);
      req.user.company_id = rows.length > 0 ? rows[0].company_id : null;
    } catch (dbError) {
      req.user.company_id = null;
    }

    next();
  } catch (error) {
    console.error('Firebase Auth Error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
