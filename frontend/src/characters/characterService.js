import axios from 'axios';
import { API_BASE, uploadUrl } from '@/lib/api';

const API_URL = `${API_BASE}/characters`;

/**
 * The backend MERGES character_data into what is stored: a key missing from the request is left
 * alone (so a draft that lost a key can't erase it). Deleting a key must be explicit. The sheet
 * clears a key by setting it to `undefined`, which JSON.stringify would silently drop — so those
 * keys are turned into `character_data_remove` here, keeping every existing "clear it" write working.
 * Exported for tests.
 */
export function toUpdatePayload(update) {
  const cd = update?.character_data;
  if (!cd || typeof cd !== 'object') return update;
  const remove = Object.keys(cd).filter((k) => cd[k] === undefined);
  if (!remove.length) return update;
  const kept = Object.fromEntries(Object.entries(cd).filter(([, v]) => v !== undefined));
  return {
    ...update,
    character_data: kept,
    character_data_remove: [...new Set([...(update.character_data_remove ?? []), ...remove])],
  };
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const characterService = {
  getCharactersByCampaign: async (campaignId) => {
    try {
      const response = await api.get(`/campaign/${campaignId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to fetch characters' };
    }
  },

  getCharacterById: async (characterId) => {
    try {
      const response = await api.get(`/${characterId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to fetch character' };
    }
  },

  createCharacter: async (characterData) => {
    try {
      const response = await api.post('', characterData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to create character' };
    }
  },

  updateCharacter: async (characterId, characterData) => {
    try {
      const response = await api.put(`/${characterId}`, toUpdatePayload(characterData));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to update character' };
    }
  },

  deleteCharacter: async (characterId) => {
    try {
      await api.delete(`/${characterId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to delete character' };
    }
  },

  toggleVisibility: async (characterId, isVisible) => {
    try {
      const response = await api.patch(`/${characterId}/visibility`, { is_visible: isVisible });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to toggle visibility' };
    }
  },

  // ── Image ──────────────────────────────────────────────────────────────────

  uploadImage: async (characterId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`${API_URL}/${characterId}/image`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to upload image' };
    }
  },

  deleteImage: async (characterId) => {
    try {
      const response = await api.delete(`/${characterId}/image`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to delete image' };
    }
  },

  // ── Theme music ──────────────────────────────────────────────────────────────

  uploadMusic: async (characterId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`${API_URL}/${characterId}/music`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to upload music' };
    }
  },

  deleteMusic: async (characterId) => {
    try {
      const response = await api.delete(`/${characterId}/music`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to delete music' };
    }
  },

  // ── Timeline events ────────────────────────────────────────────────────────

  getTimelineEvents: async (characterId) => {
    try {
      const response = await api.get(`/${characterId}/timeline-events`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to fetch timeline events' };
    }
  },

  createTimelineEvent: async (characterId, eventData) => {
    try {
      const response = await api.post(`/${characterId}/timeline-events`, eventData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to create timeline event' };
    }
  },

  removeTimelineEvent: async (characterId, linkId) => {
    try {
      await api.delete(`/${characterId}/timeline-events/${linkId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to remove timeline event' };
    }
  },

  // ── NPCs ───────────────────────────────────────────────────────────────────

  getCharacterNpcs: async (characterId) => {
    try {
      const response = await api.get(`/${characterId}/npcs`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to fetch NPCs' };
    }
  },

  createCharacterNpc: async (characterId, npcData) => {
    try {
      const response = await api.post(`/${characterId}/npcs`, npcData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to create NPC' };
    }
  },

  removeCharacterNpc: async (characterId, linkId) => {
    try {
      await api.delete(`/${characterId}/npcs/${linkId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to remove NPC' };
    }
  },

  // ── Rest ───────────────────────────────────────────────────────────────────

  // `optIns` is only meaningful for restType 'initiative': {characterId: [featureName]} for
  // features the player must CHOOSE to use (they cost a limited charge, so the backend ignores
  // them unless named here).
  applyRest: async (campaignId, restType, characterIds, optIns = null) => {
    try {
      const response = await api.post(`/campaign/${campaignId}/rest`, {
        rest_type: restType,
        character_ids: characterIds,
        ...(optIns ? { opt_ins: optIns } : {}),
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to apply rest' };
    }
  },

  // What a rest WOULD do, without doing it: the same endpoint with `dry_run`, so the dialog shows
  // the backend's own answer instead of a frontend prediction.
  previewRest: async (campaignId, restType, characterIds) => {
    try {
      const response = await api.post(`/campaign/${campaignId}/rest`, {
        rest_type: restType,
        character_ids: characterIds,
        dry_run: true,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to preview rest' };
    }
  },

  /** Which of these characters have an initiative feature they must opt into, and is it still
   *  available. Read-only; the encounter page asks rather than mirroring the backend table. */
  getInitiativeOptions: async (campaignId, characterIds = []) => {
    try {
      const response = await api.get(`/campaign/${campaignId}/initiative-options`, {
        params: { character_ids: characterIds.join(',') },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to load initiative options' };
    }
  },
};

export default characterService;

export const mapCharacterImageUrl = (path) => uploadUrl(path);
