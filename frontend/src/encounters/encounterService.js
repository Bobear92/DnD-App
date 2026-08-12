import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/gm/campaigns';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const fail = (error, fallback) => ({
  success: false,
  error: error.response?.data?.detail || fallback,
});

/**
 * Encounters — the GM's combat/initiative tool. Every endpoint is GM-only (reads included), so a
 * player calling any of these gets a 403 surfaced as `{success: false}`.
 *
 * Combatants come back already sorted (highest initiative first, unrolled last) — the server owns
 * the order so it can't differ between callers. `updateCombatant` therefore returns the WHOLE
 * encounter, not the one row: changing a value re-sorts everything.
 */
const encounterService = {
  getEncounters: async (campaignId) => {
    try {
      const res = await api.get(`/${campaignId}/encounters`);
      return { success: true, data: res.data };
    } catch (error) {
      return fail(error, 'Failed to load encounters');
    }
  },

  getEncounter: async (campaignId, encounterId) => {
    try {
      const res = await api.get(`/${campaignId}/encounters/${encounterId}`);
      return { success: true, data: res.data };
    } catch (error) {
      return fail(error, 'Failed to load encounter');
    }
  },

  createEncounter: async (campaignId, { name, character_ids = [] }) => {
    try {
      const res = await api.post(`/${campaignId}/encounters`, { name, character_ids });
      return { success: true, data: res.data };
    } catch (error) {
      return fail(error, 'Failed to create encounter');
    }
  },

  deleteEncounter: async (campaignId, encounterId) => {
    try {
      await api.delete(`/${campaignId}/encounters/${encounterId}`);
      return { success: true };
    } catch (error) {
      return fail(error, 'Failed to delete encounter');
    }
  },

  addCombatant: async (campaignId, encounterId, characterId, initiative = null) => {
    try {
      const res = await api.post(`/${campaignId}/encounters/${encounterId}/combatants`, {
        character_id: characterId,
        initiative,
      });
      return { success: true, data: res.data };
    } catch (error) {
      return fail(error, 'Failed to add combatant');
    }
  },

  setInitiative: async (campaignId, encounterId, combatantId, initiative) => {
    try {
      const res = await api.put(
        `/${campaignId}/encounters/${encounterId}/combatants/${combatantId}`,
        { initiative },
      );
      return { success: true, data: res.data };
    } catch (error) {
      return fail(error, 'Failed to set initiative');
    }
  },

  removeCombatant: async (campaignId, encounterId, combatantId) => {
    try {
      await api.delete(`/${campaignId}/encounters/${encounterId}/combatants/${combatantId}`);
      return { success: true };
    } catch (error) {
      return fail(error, 'Failed to remove combatant');
    }
  },
};

export default encounterService;
