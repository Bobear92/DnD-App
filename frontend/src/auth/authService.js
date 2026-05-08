import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth';

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
        error: error.response?.data?.detail || 'Registration failed',
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
        error: error.response?.data?.detail || 'Login failed',
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
        error: error.response?.data?.detail || 'Failed to get user',
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