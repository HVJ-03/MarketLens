import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase.js';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Sync user to MongoDB on login
        try {
          await syncUserToBackend(firebaseUser);
        } catch (err) {
          console.error('Failed to sync user to backend:', err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const syncUserToBackend = async (firebaseUser) => {
    const token = await firebaseUser.getIdToken();
    await api.post(
      '/auth/sync',
      {
        name: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      setError(mapFirebaseError(err.code));
      throw err;
    }
  };

  const signup = async (email, password, name) => {
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(result.user, { displayName: name });
      }
      return result.user;
    } catch (err) {
      setError(mapFirebaseError(err.code));
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      setError(mapFirebaseError(err.code));
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const getIdToken = async () => {
    if (!user) return null;
    return user.getIdToken();
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    loginWithGoogle,
    logout,
    getIdToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function mapFirebaseError(code) {
  const errorMap = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/api-key-not-valid': 'Firebase API key is not configured. Please add VITE_FIREBASE_API_KEY in client/.env.',
    'auth/invalid-api-key': 'Firebase API key is invalid. Please check VITE_FIREBASE_API_KEY in client/.env.',
    'auth/operation-not-allowed': 'Email/Password sign-in is disabled. Please enable it in Firebase Console → Build → Authentication → Sign-in method.',
    'auth/configuration-not-found': 'Firebase Auth is not enabled. Go to Firebase Console → Authentication and click Get Started.',
  };
  return errorMap[code] || 'An authentication error occurred. Please try again.';
}
