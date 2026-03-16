import axios from 'axios';

const API_URL = 'http://localhost:8000/api/gm/campaigns';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
};

export default campaignService;