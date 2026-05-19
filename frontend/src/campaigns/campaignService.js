import axios from 'axios';

const API_URL = 'http://localhost:8000/api/gm/campaigns';
const AUTH_API_URL = 'http://localhost:8000/api/auth';

const authConfig = () => {
  const token = localStorage.getItem('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const authApi = axios.create({
  baseURL: AUTH_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests
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

authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const campaignService = {
  // Get all campaigns (admin sees all, players see only theirs)
  getAllCampaigns: async () => {
    try {
      const response = await api.get('');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch campaigns',
      };
    }
  },

  // Get specific campaign by ID
  getCampaignById: async (campaignId) => {
    try {
      const response = await api.get(`/${campaignId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch campaign',
      };
    }
  },

  // Create new campaign (admin only)
  createCampaign: async (campaignData) => {
    try {
      const response = await api.post('', campaignData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create campaign',
      };
    }
  },

  // Update campaign (admin only)
  updateCampaign: async (campaignId, campaignData) => {
    try {
      const response = await api.put(`/${campaignId}`, campaignData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update campaign',
      };
    }
  },

  // Delete campaign (admin only)
  deleteCampaign: async (campaignId) => {
    try {
      const response = await api.delete(`/${campaignId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete campaign',
      };
    }
  },

  // Add a player to a campaign (GM only)
  addPlayer: async (campaignId, userId) => {
    try {
      const response = await api.post(`/${campaignId}/players`, { user_id: userId });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to add player',
      };
    }
  },

  // Remove a player from a campaign (GM only)
  removePlayer: async (campaignId, userId) => {
    try {
      await api.delete(`/${campaignId}/players/${userId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to remove player',
      };
    }
  },

  // Search users by username or email (for invite flow)
  searchUsers: async (q) => {
    if (!q || q.length < 2) return { success: true, data: [] };
    try {
      const response = await authApi.get('/users/search', { params: { q } });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to search users',
      };
    }
  },
};

export default campaignService;