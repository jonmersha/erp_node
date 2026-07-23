import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';

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
    

    next();
  } catch (error) {
    console.error('Firebase Auth Error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
