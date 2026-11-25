import { createApiClient } from '@/lib/apiClient';
import { API_BASE } from '@/lib/api';

const BASE_URL = API_BASE;

const api = createApiClient(BASE_URL);

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
