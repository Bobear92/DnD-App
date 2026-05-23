import { NavLink, useParams } from 'react-router-dom';
import { useCampaign } from '../../../campaigns/CampaignContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Drama, Map, Clock, BookOpen, Menu, ChevronLeft, GitBranch, Settings,
} from 'lucide-react';

const Sidebar = ({ collapsed, toggleSidebar }) => {
  const { campaignId } = useParams();
  const { campaign } = useCampaign();

  const isGm = campaign?.userRole === 'gm';

  const gmNavItems = [
    { path: `/campaigns/${campaignId}/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
    { path: `/campaigns/${campaignId}/characters`, icon: Users, label: 'Characters' },
    { path: `/campaigns/${campaignId}/npcs`, icon: Drama, label: 'NPCs' },
    { path: `/campaigns/${campaignId}/locations`, icon: Map, label: 'Locations' },
    { path: `/campaigns/${campaignId}/timeline`, icon: GitBranch, label: 'Timeline' },
    { path: `/campaigns/${campaignId}/campaign-time`, icon: Clock, label: 'Calendar' },
    { path: `/campaigns/${campaignId}/sessions`, icon: BookOpen, label: 'Session Notes' },
    { path: `/campaigns/${campaignId}/settings`, icon: Settings, label: 'Campaign Settings' },
  ];

  const playerNavItems = [
    { path: `/campaigns/${campaignId}/characters`, icon: Users, label: 'My Characters' },
    { path: `/campaigns/${campaignId}/npcs`, icon: Drama, label: 'NPCs' },
    { path: `/campaigns/${campaignId}/locations`, icon: Map, label: 'Locations' },
    { path: `/campaigns/${campaignId}/timeline`, icon: GitBranch, label: 'Timeline' },
    { path: `/campaigns/${campaignId}/sessions`, icon: BookOpen, label: 'Session Notes' },
  ];

  const navItems = isGm ? gmNavItems : playerNavItems;

  return (
    <div className={cn(
      'flex flex-col h-full bg-card border-r border-border transition-all duration-200 shrink-0',
      collapsed ? 'w-14' : 'w-56'
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 h-14 px-3 border-b border-border shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{campaign?.name || 'Campaign'}</p>
            <p className="text-xs text-muted-foreground">{isGm ? 'Game Master' : 'Player'}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer — switch campaign */}
      <div className="p-2 border-t border-border">
        <NavLink
          to="/campaigns"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? 'Switch Campaign' : undefined}
        >
          <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && <span>Switch Campaign</span>}
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
