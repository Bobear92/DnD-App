import axios from 'axios';
import { API_BASE } from '@/lib/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Generic encyclopedia-item client. `category` is the REST endpoint slug
// ('weapons', 'armor', 'adventuring-gear', 'potions', 'magic-items', 'food-drink').
const itemService = {
  getItems: async (category, campaignId) => {
    try {
      const params = campaignId ? { campaign_id: campaignId } : {};
      const res = await api.get(`/encyclopedia/items/${category}`, { params });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  getItem: async (category, itemId) => {
    const res = await api.get(`/encyclopedia/items/${category}/${itemId}`);
    return res.data;
  },

  createItem: async (category, data) => {
    const res = await api.post(`/encyclopedia/items/${category}`, data);
    return res.data;
  },

  updateItem: async (category, itemId, data) => {
    const res = await api.put(`/encyclopedia/items/${category}/${itemId}`, data);
    return res.data;
  },

  deleteItem: async (category, itemId) => {
    const res = await api.delete(`/encyclopedia/items/${category}/${itemId}`);
    return res.data;
  },
};

export default itemService;
