import { useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useCampaign } from '../../../campaigns/CampaignContext';
import { LogOut, ChevronDown } from 'lucide-react';

const Header = ({ onLogout }) => {
  const { user } = useAuth();
  const { campaign } = useCampaign();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-card shrink-0">
      <h1 className="text-base font-semibold text-foreground">{campaign?.name || ''}</h1>

      <div className="relative">
        <button
          onClick={() => setShowMenu(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted transition-colors text-sm"
        >
          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
            {user?.username?.charAt(0).toUpperCase()}
          </span>
          <span className="text-foreground">{user?.username}</span>
          <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${showMenu ? 'rotate-180' : ''}`} />
        </button>

        {showMenu && (
          <>
            <div className="absolute right-0 top-full mt-1 w-52 rounded-md border border-border bg-card shadow-md z-50 py-1">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                {user?.is_admin && (
                  <span className="text-xs text-primary font-medium">Admin</span>
                )}
              </div>
              <button
                onClick={() => { setShowMenu(false); onLogout(); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
