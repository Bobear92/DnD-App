import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ collapsed, toggleSidebar, user, campaign }) => {

  // GM Navigation Items
  const gmNavItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/characters', icon: '👥', label: 'Characters' },
    { path: '/npcs', icon: '🎭', label: 'NPCs' },
    { path: '/locations', icon: '🗺️', label: 'Locations' },
    { path: '/notes', icon: '📝', label: 'Session Notes' },
    { path: '/encounters', icon: '⚔️', label: 'Encounters' },
    { path: '/loot', icon: '💰', label: 'Loot Tables' },
  ];

  // Player Navigation Items
  const playerNavItems = [
    { path: '/my-characters', icon: '👤', label: 'My Characters' },
    { path: '/party', icon: '👥', label: 'Party' },
    { path: '/npcs', icon: '🎭', label: 'NPCs' },
    { path: '/locations', icon: '🗺️', label: 'Locations' },
    { path: '/notes', icon: '📝', label: 'Notes' },
  ];

  // Encyclopedia Items (same for both)
  const encyclopediaItems = [
    { path: '/encyclopedia/bestiary', icon: '🐉', label: 'Bestiary' },
    { path: '/encyclopedia/spells', icon: '✨', label: 'Spells' },
    { path: '/encyclopedia/items', icon: '⚔️', label: 'Items' },
  ];

  const navItems = user?.is_admin ? gmNavItems : playerNavItems;

  // Get campaign name from props
  const campaignName = campaign?.name || 'No Campaign';

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <button 
          onClick={toggleSidebar}
          className="sidebar-toggle"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        {!collapsed && (
          <div className="campaign-info">
            <span className="campaign-name">{campaignName}</span>
            <span className="role-badge">{user?.is_admin ? 'GM' : 'Player'}</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <div className="nav-section-title">Main</div>}
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
              title={collapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Encyclopedia Section */}
        <div className="nav-section">
          {!collapsed && <div className="nav-section-title">Encyclopedia</div>}
          {encyclopediaItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
              title={collapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Sidebar Footer */}
      {!collapsed && (
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.username}</span>
            <span className="user-email">{user?.email}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;