import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const classService = {
  getClasses: async (edition, campaignId) => {
    try {
      const params = {};
      if (edition) params.edition = edition;
      if (campaignId) params.campaign_id = campaignId;
      const res = await api.get('/classes', { params });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  getClassByName: async (name, edition, campaignId) => {
    try {
      const params = { name };
      if (edition) params.edition = edition;
      if (campaignId) params.campaign_id = campaignId;
      const res = await api.get('/classes', { params });
      const list = Array.isArray(res.data) ? res.data : [];
      return list[0] || null;
    } catch {
      return null;
    }
  },
};

export default classService;
