import 'dotenv/config';
import admin from 'firebase-admin';

const initFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      'Firebase Admin SDK credentials not fully configured. Auth verification will fail.'
    );
    admin.initializeApp({ projectId });
    return admin;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  console.log('Firebase Admin SDK initialized');
  return admin;
};

export default initFirebaseAdmin();
