import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import authService from '../../../auth/authService';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // If no user, redirect to login
      navigate('/login');
      return;
    }

    // Get selected campaign
    const storedCampaign = localStorage.getItem('selectedCampaign');
    if (storedCampaign) {
      setCampaign(JSON.parse(storedCampaign));
    } else {
      // If no campaign selected, redirect to campaign selection
      navigate('/campaigns');
      return;
    }

    // Get saved sidebar state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null) {
      setSidebarCollapsed(JSON.parse(savedSidebarState));
    }
  }, [navigate]);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!user || !campaign) {
    return null; // Or a loading spinner
  }

  return (
    <div className="main-layout">
      <Sidebar 
        collapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        user={user}
        campaign={campaign}
      />
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header 
          user={user}
          campaign={campaign}
          onLogout={handleLogout}
        />
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;