import axios from 'axios';

const API_URL = 'http://localhost:8000/api/characters';

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

const characterService = {
  // Get all characters in a campaign (filters by visibility and ownership)
  getCharactersByCampaign: async (campaignId) => {
    try {
      const response = await api.get(`/campaign/${campaignId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch characters',
      };
    }
  },

  // Get specific character by ID
  getCharacterById: async (characterId) => {
    try {
      const response = await api.get(`/${characterId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch character',
      };
    }
  },

  // Create new character
  createCharacter: async (characterData) => {
    try {
      const response = await api.post('', characterData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create character',
      };
    }
  },

  // Update character
  updateCharacter: async (characterId, characterData) => {
    try {
      const response = await api.put(`/${characterId}`, characterData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update character',
      };
    }
  },

  // Delete character
  deleteCharacter: async (characterId) => {
    try {
      const response = await api.delete(`/${characterId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete character',
      };
    }
  },

  // Toggle character visibility (GM only)
  toggleVisibility: async (characterId) => {
    try {
      const response = await api.patch(`/${characterId}/visibility`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to toggle visibility',
      };
    }
  },
};

export default characterService;