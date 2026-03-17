import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ user, campaign, onLogout }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get campaign name from props
  const currentCampaign = campaign?.name || 'No Campaign';

  const handleCampaignSwitch = () => {
    navigate('/campaigns');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-campaign-name">{currentCampaign}</h1>
        <button 
          onClick={handleCampaignSwitch}
          className="campaign-switch-button"
          title="Switch Campaign"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L10 6H14L11 9L12 13L8 10L4 13L5 9L2 6H6L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          Switch Campaign
        </button>
      </div>

      <div className="header-right">
        <div className="user-menu">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="user-menu-button"
          >
            <span className="user-avatar">{user?.username?.charAt(0).toUpperCase()}</span>
            <span className="user-name">{user?.username}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`chevron ${showUserMenu ? 'open' : ''}`}>
              <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {showUserMenu && (
            <div className="user-menu-dropdown">
              <div className="menu-item user-info-item">
                <div className="user-info-details">
                  <span className="username-detail">{user?.username}</span>
                  <span className="email-detail">{user?.email}</span>
                  {user?.is_admin && <span className="admin-badge-detail">Game Master</span>}
                </div>
              </div>
              <div className="menu-divider"></div>
              <button onClick={() => navigate('/settings')} className="menu-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 1V3M8 13V15M15 8H13M3 8H1M13.5 13.5L12 12M4 4L2.5 2.5M13.5 2.5L12 4M4 12L2.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Settings
              </button>
              <button onClick={onLogout} className="menu-item logout-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6M11 11L14 8M14 8L11 5M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div 
          className="menu-overlay" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
};

export default Header;