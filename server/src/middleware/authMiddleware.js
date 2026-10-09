import firebaseAdmin, { firebaseAuthAvailable } from '../config/firebase.js';

/**
 * Express middleware that verifies Firebase ID tokens.
 * Attaches { uid, email } to req.user on success.
 *
 * Dev mode: when Firebase Auth is not available (no valid creds),
 * skips authentication for testing purposes.
 */
export const authMiddleware = async (req, res, next) => {
  // Dev mode: skip auth when Firebase Auth is not available
  if (process.env.NODE_ENV === 'development' && !firebaseAuthAvailable) {
    req.user = { uid: 'dev-user', email: 'dev@marketlens.local' };
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No authentication token provided',
    });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error.code || error.message);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token',
    });
  }
};
