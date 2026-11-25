import { createApiClient } from '@/lib/apiClient';
import { API_BASE } from '@/lib/api';

const api = createApiClient(API_BASE);

const encyclopediaService = {
  // `edition` ('5e' | '5.5e') picks that edition's text; a spell with no entry for the
  // requested edition falls back to its 5e text server-side.
  getSpells: async (campaignId, edition) => {
    try {
      const params = {};
      if (campaignId) params.campaign_id = campaignId;
      if (edition) params.edition = edition;
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
