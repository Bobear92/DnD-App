import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/gm/campaigns';
const UPLOADS_URL = 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function mapImageUrl(imagePath) {
  if (!imagePath) return null;
  return `${UPLOADS_URL}/${imagePath}`;
}

const locationService = {
  // Locations CRUD
  getLocations: async (campaignId) => {
    const res = await api.get(`/${campaignId}/locations`);
    return res.data;
  },

  getLocation: async (campaignId, locationId) => {
    const res = await api.get(`/${campaignId}/locations/${locationId}`);
    return res.data;
  },

  createLocation: async (campaignId, data) => {
    const res = await api.post(`/${campaignId}/locations`, data);
    return res.data;
  },

  updateLocation: async (campaignId, locationId, data) => {
    const res = await api.put(`/${campaignId}/locations/${locationId}`, data);
    return res.data;
  },

  deleteLocation: async (campaignId, locationId) => {
    await api.delete(`/${campaignId}/locations/${locationId}`);
  },

  toggleLocationVisibility: async (campaignId, locationId) => {
    const res = await api.patch(`/${campaignId}/locations/${locationId}/visibility`);
    return res.data;
  },

  // Maps
  getMaps: async (campaignId, locationId) => {
    const res = await api.get(`/${campaignId}/locations/${locationId}/maps`);
    return res.data;
  },

  uploadMap: async (campaignId, locationId, name, file) => {
    const form = new FormData();
    form.append('name', name);
    form.append('file', file);
    const res = await api.post(`/${campaignId}/locations/${locationId}/maps`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteMap: async (campaignId, locationId, mapId) => {
    await api.delete(`/${campaignId}/locations/${locationId}/maps/${mapId}`);
  },

  toggleMapVisibility: async (campaignId, locationId, mapId) => {
    const res = await api.patch(`/${campaignId}/locations/${locationId}/maps/${mapId}/visibility`);
    return res.data;
  },

  // Pins
  getPins: async (campaignId, locationId, mapId) => {
    const res = await api.get(`/${campaignId}/locations/${locationId}/maps/${mapId}/pins`);
    return res.data;
  },

  createPin: async (campaignId, locationId, mapId, data) => {
    const res = await api.post(`/${campaignId}/locations/${locationId}/maps/${mapId}/pins`, data);
    return res.data;
  },

  updatePin: async (campaignId, locationId, mapId, pinId, data) => {
    const res = await api.put(`/${campaignId}/locations/${locationId}/maps/${mapId}/pins/${pinId}`, data);
    return res.data;
  },

  deletePin: async (campaignId, locationId, mapId, pinId) => {
    await api.delete(`/${campaignId}/locations/${locationId}/maps/${mapId}/pins/${pinId}`);
  },

  // Relationships
  getRelationships: async (campaignId, locationId) => {
    const res = await api.get(`/${campaignId}/locations/${locationId}/relationships`);
    return res.data;
  },

  createRelationship: async (campaignId, locationId, data) => {
    const res = await api.post(`/${campaignId}/locations/${locationId}/relationships`, data);
    return res.data;
  },

  deleteRelationship: async (campaignId, locationId, relId) => {
    await api.delete(`/${campaignId}/locations/${locationId}/relationships/${relId}`);
  },
};

export default locationService;
