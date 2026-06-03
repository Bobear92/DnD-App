import axios from 'axios';

// Feats are mounted at /feats (no /api prefix) in the backend.
const api = axios.create({ baseURL: 'http://localhost:8000' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const featService = {
  getFeats: async (campaignId, edition) => {
    try {
      const params = {};
      if (campaignId) params.campaign_id = campaignId;
      if (edition) params.edition = edition;
      const res = await api.get('/feats', { params });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  getFeat: async (featId) => {
    const res = await api.get(`/feats/${featId}`);
    return res.data;
  },

  createFeat: async (featData) => {
    const res = await api.post('/feats', featData);
    return res.data;
  },

  updateFeat: async (featId, featData) => {
    const res = await api.put(`/feats/${featId}`, featData);
    return res.data;
  },

  deleteFeat: async (featId) => {
    const res = await api.delete(`/feats/${featId}`);
    return res.data;
  },
};

export default featService;
