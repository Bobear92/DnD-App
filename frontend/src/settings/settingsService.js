import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/gm/campaigns';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const settingsService = {
  // ── Calendar ──────────────────────────────────────────────────────────────

  getCalendar: async (campaignId) => {
    const res = await api.get(`/${campaignId}/calendar`);
    return res.data;
  },

  createCalendar: async (campaignId, data) => {
    const res = await api.post(`/${campaignId}/calendar`, data);
    return res.data;
  },

  updateCalendar: async (campaignId, data) => {
    const res = await api.put(`/${campaignId}/calendar`, data);
    return res.data;
  },

  // ── Seasons ───────────────────────────────────────────────────────────────

  createSeason: async (campaignId, data) => {
    const res = await api.post(`/${campaignId}/calendar/seasons`, data);
    return res.data;
  },

  updateSeason: async (campaignId, seasonId, data) => {
    const res = await api.put(`/${campaignId}/calendar/seasons/${seasonId}`, data);
    return res.data;
  },

  deleteSeason: async (campaignId, seasonId) => {
    await api.delete(`/${campaignId}/calendar/seasons/${seasonId}`);
  },

  // ── Months ────────────────────────────────────────────────────────────────

  createMonth: async (campaignId, data) => {
    const res = await api.post(`/${campaignId}/calendar/months`, data);
    return res.data;
  },

  updateMonth: async (campaignId, monthId, data) => {
    const res = await api.put(`/${campaignId}/calendar/months/${monthId}`, data);
    return res.data;
  },

  deleteMonth: async (campaignId, monthId) => {
    await api.delete(`/${campaignId}/calendar/months/${monthId}`);
  },

  // ── Weekdays ──────────────────────────────────────────────────────────────

  createWeekday: async (campaignId, data) => {
    const res = await api.post(`/${campaignId}/calendar/weekdays`, data);
    return res.data;
  },

  updateWeekday: async (campaignId, weekdayId, data) => {
    const res = await api.put(`/${campaignId}/calendar/weekdays/${weekdayId}`, data);
    return res.data;
  },

  deleteWeekday: async (campaignId, weekdayId) => {
    await api.delete(`/${campaignId}/calendar/weekdays/${weekdayId}`);
  },

  // ── Eras ──────────────────────────────────────────────────────────────────

  createEra: async (campaignId, data) => {
    const res = await api.post(`/${campaignId}/calendar/eras`, data);
    return res.data;
  },

  updateEra: async (campaignId, eraId, data) => {
    const res = await api.put(`/${campaignId}/calendar/eras/${eraId}`, data);
    return res.data;
  },

  deleteEra: async (campaignId, eraId) => {
    await api.delete(`/${campaignId}/calendar/eras/${eraId}`);
  },

  patchEraVisibility: async (campaignId, eraId, isVisible) => {
    const res = await api.patch(`/${campaignId}/calendar/eras/${eraId}/visibility`, {
      is_visible_to_players: isVisible,
    });
    return res.data;
  },

  // ── Timeline Events ───────────────────────────────────────────────────────

  getEvents: async (campaignId) => {
    const res = await api.get(`/${campaignId}/timeline`);
    return res.data;
  },

  createEvent: async (campaignId, data) => {
    const res = await api.post(`/${campaignId}/timeline`, data);
    return res.data;
  },

  updateEvent: async (campaignId, eventId, data) => {
    const res = await api.put(`/${campaignId}/timeline/${eventId}`, data);
    return res.data;
  },

  deleteEvent: async (campaignId, eventId) => {
    await api.delete(`/${campaignId}/timeline/${eventId}`);
  },

  patchEventVisibility: async (campaignId, eventId, isVisible) => {
    const res = await api.patch(`/${campaignId}/timeline/${eventId}/visibility`, {
      is_visible_to_players: isVisible,
    });
    return res.data;
  },

  // ── Event NPC Links ───────────────────────────────────────────────────────

  getEventNpcs: async (campaignId, eventId) => {
    const res = await api.get(`/${campaignId}/timeline/${eventId}/npcs`);
    return res.data;
  },

  addEventNpc: async (campaignId, eventId, data) => {
    const res = await api.post(`/${campaignId}/timeline/${eventId}/npcs`, data);
    return res.data;
  },

  removeEventNpc: async (campaignId, eventId, linkId) => {
    await api.delete(`/${campaignId}/timeline/${eventId}/npcs/${linkId}`);
  },

  // ── Event Location Links ──────────────────────────────────────────────────

  getEventLocations: async (campaignId, eventId) => {
    const res = await api.get(`/${campaignId}/timeline/${eventId}/locations`);
    return res.data;
  },

  addEventLocation: async (campaignId, eventId, data) => {
    const res = await api.post(`/${campaignId}/timeline/${eventId}/locations`, data);
    return res.data;
  },

  removeEventLocation: async (campaignId, eventId, linkId) => {
    await api.delete(`/${campaignId}/timeline/${eventId}/locations/${linkId}`);
  },

  getEventsForLocation: async (campaignId, locationId) => {
    const res = await api.get(`/${campaignId}/timeline?location_id=${locationId}`);
    return res.data;
  },

  getEventsForNpc: async (campaignId, npcId) => {
    const res = await api.get(`/${campaignId}/timeline?npc_id=${npcId}`);
    return res.data;
  },
};

export default settingsService;
