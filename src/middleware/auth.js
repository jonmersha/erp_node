import jwt from 'jsonwebtoken';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_dev_secret_key';
    const decodedToken = jwt.verify(token, jwtSecret);
    
    // Attach user to req
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name
    };
    
    next();
  } catch (error) {
    console.error('Custom JWT Auth Error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
