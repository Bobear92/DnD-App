import { createApiClient } from '@/lib/apiClient';
import { API_BASE } from '@/lib/api';

const API_URL = `${API_BASE}/gm/campaigns`;
const AUTH_API_URL = `${API_BASE}/auth`;

// Clients come from the shared factory (token + expired-session handling): src/lib/apiClient.js
const api = createApiClient(API_URL, { headers: { 'Content-Type': 'application/json' } });

const authApi = createApiClient(AUTH_API_URL, { headers: { 'Content-Type': 'application/json' } });

const campaignService = {
  // Get all campaigns (admin sees all, players see only theirs)
  getAllCampaigns: async () => {
    try {
      const response = await api.get('');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch campaigns',
      };
    }
  },

  // Get specific campaign by ID
  getCampaignById: async (campaignId) => {
    try {
      const response = await api.get(`/${campaignId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch campaign',
      };
    }
  },

  // Create new campaign (admin only)
  createCampaign: async (campaignData) => {
    try {
      const response = await api.post('', campaignData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create campaign',
      };
    }
  },

  // Update campaign (admin only)
  updateCampaign: async (campaignId, campaignData) => {
    try {
      const response = await api.put(`/${campaignId}`, campaignData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update campaign',
      };
    }
  },

  // Delete campaign (admin only)
  deleteCampaign: async (campaignId) => {
    try {
      const response = await api.delete(`/${campaignId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to delete campaign',
      };
    }
  },

  // Invite a user to a campaign (GM only). They join only once they accept.
  invitePlayer: async (campaignId, userId) => {
    try {
      const response = await api.post(`/${campaignId}/invites`, { user_id: userId });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to invite player',
      };
    }
  },

  // Pending invites for a campaign (GM only)
  getInvites: async (campaignId) => {
    try {
      const response = await api.get(`/${campaignId}/invites`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to load invites',
      };
    }
  },

  // Withdraw a pending invite (GM only)
  cancelInvite: async (campaignId, inviteId) => {
    try {
      await api.delete(`/${campaignId}/invites/${inviteId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to cancel invite',
      };
    }
  },

  // The current user's pending invites
  getMyInvites: async () => {
    try {
      const response = await api.get('/invites/mine');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to load invitations',
      };
    }
  },

  // Accept your own invite — returns the campaign you joined
  acceptInvite: async (inviteId) => {
    try {
      const response = await api.post(`/invites/${inviteId}/accept`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to accept invitation',
      };
    }
  },

  // Decline your own invite
  declineInvite: async (inviteId) => {
    try {
      await api.post(`/invites/${inviteId}/decline`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to decline invitation',
      };
    }
  },

  // Remove a player from a campaign (GM only)
  removePlayer: async (campaignId, userId) => {
    try {
      await api.delete(`/${campaignId}/players/${userId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to remove player',
      };
    }
  },

  // Search users by username (for invite flow) — the API never matches or returns emails
  searchUsers: async (q) => {
    if (!q) return { success: true, data: [] };
    try {
      const response = await authApi.get('/users/search', { params: { q } });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to search users',
      };
    }
  },
};

export default campaignService;