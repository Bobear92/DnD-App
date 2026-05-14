import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/gm/campaigns';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const sessionService = {
  // ── Session CRUD ──────────────────────────────────────────────────────────

  listSessions: async (campaignId, params = {}) => {
    const res = await api.get(`/${campaignId}/sessions`, { params });
    return res.data;
  },

  getSession: async (campaignId, sessionId) => {
    const res = await api.get(`/${campaignId}/sessions/${sessionId}`);
    return res.data;
  },

  createSession: async (campaignId, data) => {
    const res = await api.post(`/${campaignId}/sessions`, data);
    return res.data;
  },

  updateSession: async (campaignId, sessionId, data) => {
    const res = await api.put(`/${campaignId}/sessions/${sessionId}`, data);
    return res.data;
  },

  deleteSession: async (campaignId, sessionId) => {
    await api.delete(`/${campaignId}/sessions/${sessionId}`);
  },

  updateVisibility: async (campaignId, sessionId, isVisible) => {
    const res = await api.patch(`/${campaignId}/sessions/${sessionId}/visibility`, {
      is_visible_to_players: isVisible,
    });
    return res.data;
  },

  // ── Images ────────────────────────────────────────────────────────────────

  uploadImage: async (campaignId, sessionId, file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/${campaignId}/sessions/${sessionId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data; // { image_url: "uploads/sessions/..." }
  },

  deleteImage: async (campaignId, sessionId, filename) => {
    await api.delete(`/${campaignId}/sessions/${sessionId}/images/${filename}`);
  },

  // ── NPC links ─────────────────────────────────────────────────────────────

  listNpcLinks: async (campaignId, sessionId) => {
    const res = await api.get(`/${campaignId}/sessions/${sessionId}/npcs`);
    return res.data;
  },

  addNpcLink: async (campaignId, sessionId, data) => {
    const res = await api.post(`/${campaignId}/sessions/${sessionId}/npcs`, data);
    return res.data;
  },

  removeNpcLink: async (campaignId, sessionId, linkId) => {
    await api.delete(`/${campaignId}/sessions/${sessionId}/npcs/${linkId}`);
  },

  // ── Location links ────────────────────────────────────────────────────────

  listLocationLinks: async (campaignId, sessionId) => {
    const res = await api.get(`/${campaignId}/sessions/${sessionId}/locations`);
    return res.data;
  },

  addLocationLink: async (campaignId, sessionId, data) => {
    const res = await api.post(`/${campaignId}/sessions/${sessionId}/locations`, data);
    return res.data;
  },

  removeLocationLink: async (campaignId, sessionId, linkId) => {
    await api.delete(`/${campaignId}/sessions/${sessionId}/locations/${linkId}`);
  },

  // ── Timeline event links ──────────────────────────────────────────────────

  listEventLinks: async (campaignId, sessionId) => {
    const res = await api.get(`/${campaignId}/sessions/${sessionId}/timeline-events`);
    return res.data;
  },

  addEventLink: async (campaignId, sessionId, data) => {
    const res = await api.post(`/${campaignId}/sessions/${sessionId}/timeline-events`, data);
    return res.data;
  },

  removeEventLink: async (campaignId, sessionId, linkId) => {
    await api.delete(`/${campaignId}/sessions/${sessionId}/timeline-events/${linkId}`);
  },

  // ── Character links ───────────────────────────────────────────────────────

  listCharacterLinks: async (campaignId, sessionId) => {
    const res = await api.get(`/${campaignId}/sessions/${sessionId}/characters`);
    return res.data;
  },

  addCharacterLink: async (campaignId, sessionId, data) => {
    const res = await api.post(`/${campaignId}/sessions/${sessionId}/characters`, data);
    return res.data;
  },

  removeCharacterLink: async (campaignId, sessionId, linkId) => {
    await api.delete(`/${campaignId}/sessions/${sessionId}/characters/${linkId}`);
  },
};

export default sessionService;

export function mapSessionImageUrl(imagePath) {
  if (!imagePath) return null;
  return `http://localhost:8000/${imagePath}`;
}
