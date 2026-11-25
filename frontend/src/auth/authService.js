import { createApiClient } from '@/lib/apiClient';
import { API_BASE } from '@/lib/api';

const API_URL = `${API_BASE}/auth`;

// Create axios instance with base configuration
const api = createApiClient(API_URL, { headers: { 'Content-Type': 'application/json' } });

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

  // Ask for a reset link. The server answers the same whether or not the account exists.
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/forgot-password', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, error: errorText(error, 'Could not send the reset link') };
    }
  },

  // Spend a reset link's token on a new password.
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/reset-password', { token, new_password: newPassword });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, error: errorText(error, 'Could not reset the password') };
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