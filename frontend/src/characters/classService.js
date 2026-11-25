import { createApiClient } from '@/lib/apiClient';
import { API_BASE } from '@/lib/api';

const BASE_URL = API_BASE;

const api = createApiClient(BASE_URL);

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
