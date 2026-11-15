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

  // Heal stale context. The stored campaign can be out of date in two ways:
  //  - userRole: computed from created_by, which campaigns saved before the
  //    schema fix lack;
  //  - campaign_mode: the GM can switch world-building mode at any time, and a
  //    player's localStorage copy would otherwise keep the old feature set.
  // So the campaign is re-fetched on mount and the context updated if either differs.
  useEffect(() => {
    if (!user || !campaign) return;

    const heal = async () => {
      const result = await campaignService.getCampaignById(campaign.id);
      const fresh = result?.success ? result.data : null;

      const createdBy = campaign.created_by ?? fresh?.created_by;
      if (createdBy === undefined) return;

      const correctRole = createdBy === user.id ? 'gm' : 'player';
      const mode = fresh?.campaign_mode ?? campaign.campaign_mode;
      if (
        campaign.created_by === undefined ||
        campaign.userRole !== correctRole ||
        mode !== campaign.campaign_mode
      ) {
        enterCampaign({ ...campaign, created_by: createdBy, userRole: correctRole, campaign_mode: mode });
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
