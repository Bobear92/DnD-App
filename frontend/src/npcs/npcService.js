import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/gm/campaigns';
const UPLOADS_URL = 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function mapNpcImageUrl(imagePath) {
  if (!imagePath) return null;
  return `${UPLOADS_URL}/${imagePath}`;
}

const npcService = {
  getNpcs: async (campaignId) => {
    const res = await api.get(`/npcs/campaign/${campaignId}`);
    return res.data;
  },

  getNpc: async (npcId) => {
    const res = await api.get(`/npcs/${npcId}`);
    return res.data;
  },

  createNpc: async (data) => {
    const res = await api.post('/npcs', data);
    return res.data;
  },

  updateNpc: async (npcId, data) => {
    const res = await api.put(`/npcs/${npcId}`, data);
    return res.data;
  },

  deleteNpc: async (npcId) => {
    await api.delete(`/npcs/${npcId}`);
  },

  toggleVisibility: async (npcId) => {
    const res = await api.patch(`/npcs/${npcId}/visibility`);
    return res.data;
  },

  uploadImage: async (npcId, file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/npcs/${npcId}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteImage: async (npcId) => {
    const res = await api.delete(`/npcs/${npcId}/image`);
    return res.data;
  },

  // NPC-to-NPC relationships
  getRelationships: async (npcId) => {
    const res = await api.get(`/npcs/${npcId}/relationships`);
    return res.data;
  },

  createRelationship: async (npcId, data) => {
    const res = await api.post(`/npcs/${npcId}/relationships`, data);
    return res.data;
  },

  deleteRelationship: async (npcId, relId) => {
    await api.delete(`/npcs/${npcId}/relationships/${relId}`);
  },

  // NPC-to-player relationships
  getPlayerRelationships: async (npcId) => {
    const res = await api.get(`/npcs/${npcId}/player-relationships`);
    return res.data;
  },

  createPlayerRelationship: async (npcId, data) => {
    const res = await api.post(`/npcs/${npcId}/player-relationships`, data);
    return res.data;
  },

  deletePlayerRelationship: async (npcId, relId) => {
    await api.delete(`/npcs/${npcId}/player-relationships/${relId}`);
  },

  // Campaign helpers
  getCampaignDetails: async (campaignId) => {
    const res = await api.get(`/${campaignId}`);
    return res.data;
  },
};

export default npcService;
