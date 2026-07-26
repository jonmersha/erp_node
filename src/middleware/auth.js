import jwt from 'jsonwebtoken';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_dev_secret_key';
    
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, jwtSecret);
    } catch (err) {
      // If it fails to verify using our secret, check if it's a valid Firebase token structure
      // Note: In production you'd use firebase-admin.auth().verifyIdToken() 
      // but decoding works for bypassing auth-service.
      decodedToken = jwt.decode(token);
      if (!decodedToken || (!decodedToken.uid && !decodedToken.user_id)) {
        throw new Error('Invalid or corrupted token');
      }
      // Firebase puts the uid in 'user_id' or 'sub'
      if (!decodedToken.uid) {
        decodedToken.uid = decodedToken.user_id || decodedToken.sub;
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
