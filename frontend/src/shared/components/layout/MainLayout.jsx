import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../../auth/AuthContext';
import { useCampaign } from '../../../campaigns/CampaignContext';
import campaignService from '../../../campaigns/campaignService';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { campaign, enterCampaign } = useCampaign();

  // Heal stale userRole. If created_by is missing from the stored campaign
  // (saved before the schema fix), fetch it from the API so the role can be
  // computed correctly without requiring the user to re-enter the campaign.
  useEffect(() => {
    if (!user || !campaign) return;

    const heal = async () => {
      let createdBy = campaign.created_by;

      if (createdBy === undefined) {
        const result = await campaignService.getCampaignById(campaign.id);
        if (result.success) createdBy = result.data.created_by;
      }

      if (createdBy === undefined) return;

      const correctRole = createdBy === user.id ? 'gm' : 'player';
      if (campaign.created_by === undefined || campaign.userRole !== correctRole) {
        enterCampaign({ ...campaign, created_by: createdBy, userRole: correctRole });
      }
    };

    heal();
  }, [user?.id, campaign?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sidebarCollapsed')) || false; } catch { return false; }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
