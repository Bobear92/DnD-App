import axios from 'axios';
import { API_BASE } from '@/lib/api';

const API_URL = `${API_BASE}/auth`;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// FastAPI's `detail` is a string for an HTTPException but a LIST of {msg, ...} for a 422 validation error. Passing
// the list to setError crashed the login page, so always hand the UI text.
export function errorText(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d) => (typeof d === 'string' ? d : d?.msg)).filter(Boolean).join('; ') || fallback;
  }
  return fallback;
}

export const PASSWORD_MIN_LENGTH = 8; // mirrors backend auth/schemas.py

// Auth service functions
const authService = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: errorText(error, 'Registration failed'),
      };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        return { success: true, data: response.data };
      }
      return { success: false, error: 'No token received' };
    } catch (error) {
      return {
        success: false,
        error: errorText(error, 'Login failed'),
      };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/me');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: errorText(error, 'Failed to get user'),
      };
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedCampaign');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('token');
  },
};

export default authService;