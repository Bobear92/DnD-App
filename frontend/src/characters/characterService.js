import axios from 'axios';

const API_URL = 'http://localhost:8000/api/characters';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const characterService = {
  getCharactersByCampaign: async (campaignId) => {
    try {
      const response = await api.get(`/campaign/${campaignId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to fetch characters' };
    }
  },

  getCharacterById: async (characterId) => {
    try {
      const response = await api.get(`/${characterId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to fetch character' };
    }
  },

  createCharacter: async (characterData) => {
    try {
      const response = await api.post('', characterData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to create character' };
    }
  },

  updateCharacter: async (characterId, characterData) => {
    try {
      const response = await api.put(`/${characterId}`, characterData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to update character' };
    }
  },

  deleteCharacter: async (characterId) => {
    try {
      await api.delete(`/${characterId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to delete character' };
    }
  },

  toggleVisibility: async (characterId, isVisible) => {
    try {
      const response = await api.patch(`/${characterId}/visibility`, { is_visible: isVisible });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to toggle visibility' };
    }
  },
};

export default characterService;
