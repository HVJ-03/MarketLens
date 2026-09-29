import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC1Mfyo5dw5hdtmLzeQO2_wblj_Fjb3UeQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'serpapi-18d9b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'serpapi-18d9b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'serpapi-18d9b.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '402153183932',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:402153183932:web:bcf271eb5cae3c067a4eb9',
};

// Initialize Firebase safely without crashing if config is incomplete
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
