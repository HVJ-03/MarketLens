import 'dotenv/config';
import admin from 'firebase-admin';

// Track whether Firebase Auth is actually available
let firebaseAuthAvailable = false;

const initFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Graceful degradation: if Firebase creds are missing or invalid, continue without them
  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      'Firebase Admin SDK credentials not fully configured. Auth verification will fail.'
    );
    admin.initializeApp({ projectId });
    return admin;
  }

  try {
    let key = privateKey;
    // Handle \n-escaped format
    if (!key.includes('\n') && key.includes('\\n')) {
      key = key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: key,
      }),
    });
    firebaseAuthAvailable = true;
    console.log('Firebase Admin SDK initialized');
  } catch (err) {
    console.warn('Failed to initialize Firebase Admin SDK:', err.message);
    console.warn('Auth verification will fail. Continuing without Firebase.');
    admin.initializeApp({ projectId });
  }

  return admin;
};

export default initFirebaseAdmin();
export { firebaseAuthAvailable };

