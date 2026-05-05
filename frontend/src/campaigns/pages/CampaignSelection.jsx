import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import campaignService from '../campaignService';
import { useAuth } from '../../auth/AuthContext';
import { useCampaign } from '../CampaignContext';
import './CampaignSelection.css';

const CampaignSelection = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { enterCampaign } = useCampaign();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', description: '' });


const loadCampaigns = async () => {
  setLoading(true);

    // Get campaigns
    const result = await campaignService.getAllCampaigns();
    if (result.success) {
      setCampaigns(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  // useEffect goes AFTER the function, not inside it
    useEffect(() => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
        loadCampaigns();
    }, []);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    
    const result = await campaignService.createCampaign(newCampaign);
    if (result.success) {
      setShowCreateModal(false);
      setNewCampaign({ name: '', description: '' });
      loadCampaigns(); // Reload campaigns
    } else {
      setError(result.error);
    }
  };

const handleEnterCampaign = (campaign) => {
  const userRole = campaign.created_by === user?.id ? 'gm' : 'player';
  enterCampaign({ ...campaign, userRole });
  navigate(`/campaigns/${campaign.id}/locations`);
};

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="campaign-page">
        <div className="campaign-background">
          <div className="background-overlay"></div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner-large"></div>
          <p>Loading your campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-page">
      <div className="campaign-background">
        <div className="background-overlay"></div>
      </div>

      <div className="campaign-container">
        {/* Header */}
        <div className="campaign-header">
          <div className="header-content">
            <h1 className="campaign-title">Select Your Campaign</h1>
            <div className="user-info">
              <span className="username">{user?.username}</span>
              {user?.is_admin && <span className="admin-badge">Game Master</span>}
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 4V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="8" cy="12" r="0.5" fill="currentColor"/>
            </svg>
            {error}
          </div>
        )}

        {/* Create Campaign Button (any logged-in user) */}
        {user && (
          <div className="create-campaign-section">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="create-campaign-button"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Create New Campaign
            </button>
          </div>
        )}

        {/* Campaign List */}
        <div className="campaigns-grid">
          {campaigns.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <path d="M32 8L40 24H56L44 36L48 52L32 42L16 52L20 36L8 24H24L32 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
              <h2>No Campaigns Yet</h2>
              <p>Create your first campaign to begin your adventure, or wait to be invited by a Game Master.</p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="campaign-card">
                <div className="campaign-card-header">
                  <h3 className="campaign-name">{campaign.name}</h3>
                </div>
                <div className="campaign-card-body">
                  <p className="campaign-description">
                    {campaign.description || "No description provided"}
                  </p>
                </div>
                <div className="campaign-card-footer">
                  <button 
                    onClick={() => handleEnterCampaign(campaign)}
                    className="enter-campaign-button"
                  >
                    Enter Campaign
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Campaign</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="modal-close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="modal-form">
              <div className="form-group">
                <label htmlFor="campaign-name">Campaign Name</label>
                <input
                  type="text"
                  id="campaign-name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  required
                  placeholder="The Lost Mines of Phandelver"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="campaign-description">Description</label>
                <textarea
                  id="campaign-description"
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  placeholder="A thrilling adventure awaits..."
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignSelection;