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

  // ── Image ──────────────────────────────────────────────────────────────────

  uploadImage: async (characterId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`${API_URL}/${characterId}/image`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to upload image' };
    }
  },

  deleteImage: async (characterId) => {
    try {
      const response = await api.delete(`/${characterId}/image`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to delete image' };
    }
  },

  // ── Timeline events ────────────────────────────────────────────────────────

  getTimelineEvents: async (characterId) => {
    try {
      const response = await api.get(`/${characterId}/timeline-events`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to fetch timeline events' };
    }
  },

  createTimelineEvent: async (characterId, eventData) => {
    try {
      const response = await api.post(`/${characterId}/timeline-events`, eventData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to create timeline event' };
    }
  },

  removeTimelineEvent: async (characterId, linkId) => {
    try {
      await api.delete(`/${characterId}/timeline-events/${linkId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to remove timeline event' };
    }
  },

  // ── NPCs ───────────────────────────────────────────────────────────────────

  getCharacterNpcs: async (characterId) => {
    try {
      const response = await api.get(`/${characterId}/npcs`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to fetch NPCs' };
    }
  },

  createCharacterNpc: async (characterId, npcData) => {
    try {
      const response = await api.post(`/${characterId}/npcs`, npcData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to create NPC' };
    }
  },

  removeCharacterNpc: async (characterId, linkId) => {
    try {
      await api.delete(`/${characterId}/npcs/${linkId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to remove NPC' };
    }
  },

  // ── Rest ───────────────────────────────────────────────────────────────────

  applyRest: async (campaignId, restType, characterIds) => {
    try {
      const response = await api.post(`/campaign/${campaignId}/rest`, {
        rest_type: restType,
        character_ids: characterIds,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to apply rest' };
    }
  },
};

export default characterService;

export const mapCharacterImageUrl = (path) =>
  path ? `http://localhost:8000/${path}` : null;
