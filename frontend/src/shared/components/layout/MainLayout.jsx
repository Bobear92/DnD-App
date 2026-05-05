import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../../auth/AuthContext';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
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
