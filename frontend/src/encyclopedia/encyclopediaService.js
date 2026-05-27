import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const encyclopediaService = {
  getSpells: async (campaignId) => {
    try {
      const params = campaignId ? { campaign_id: campaignId } : {};
      const res = await api.get('/encyclopedia/spells', { params });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  getSpell: async (spellId) => {
    const res = await api.get(`/encyclopedia/spells/${spellId}`);
    return res.data;
  },

  createSpell: async (spellData) => {
    const res = await api.post('/encyclopedia/spells', spellData);
    return res.data;
  },

  updateSpell: async (spellId, spellData) => {
    const res = await api.put(`/encyclopedia/spells/${spellId}`, spellData);
    return res.data;
  },

  deleteSpell: async (spellId) => {
    const res = await api.delete(`/encyclopedia/spells/${spellId}`);
    return res.data;
  },
};

export default encyclopediaService;
