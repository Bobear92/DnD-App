import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const referenceService = {
  getRaces: async (campaignId) => {
    try {
      const params = campaignId ? { campaign_id: campaignId } : {};
      const res = await api.get('/races', { params });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  getBackgrounds: async (campaignId) => {
    try {
      const params = campaignId ? { campaign_id: campaignId } : {};
      const res = await api.get('/backgrounds', { params });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },
};

export default referenceService;
