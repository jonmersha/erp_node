import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';
import pool from '../db.js';

// Initialize Firebase Admin with just the projectId (sufficient for verifying ID tokens)
initializeApp({
  projectId: "ai-studio-applet-webapp-717ba",
});

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Look up user company_id
    try {
      const [rows] = await pool.query('SELECT company_id FROM users WHERE uid = ?', [decodedToken.uid]);
      req.user = { 
        ...decodedToken, 
        company_id: rows.length > 0 ? rows[0].company_id : null 
      };
    } catch (dbError) {
      console.error('DB error during auth:', dbError);
      req.user = { ...decodedToken, company_id: null };
    }
    
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token', details: error.message });
  }
};
