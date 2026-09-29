import axios from 'axios';
import { auth } from '../config/firebase.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000, // 60s — scans may take a while
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Firebase ID token
api.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error('Failed to get auth token:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Redirect to login on auth failure
      if (status === 401) {
        // Will be handled by AuthContext / ProtectedRoute
        console.warn('Authentication failed — redirecting to login');
      }

      // Return a cleaner error
      const message = data?.message || data?.error || 'An error occurred';
      return Promise.reject(new Error(message));
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Please try again.'));
    }

    return Promise.reject(new Error('Network error. Please check your connection.'));
  }
);

export default api;
