import { createContext, useContext, useState, useEffect } from 'react';
import authService from './authService';

const AuthContext = createContext(null);

/**
 * Another tab logged in, switched account or logged out (T3). The login token is shared through localStorage, so
 * without this a second window silently kept showing user A while every request went out as user B. A full page load
 * re-reads the user; /campaigns because the selected campaign may not belong to the new account.
 * The `storage` event only fires in the OTHER tabs, never the one that made the change.
 */
export function redirectOnTokenChange(event, go = (path) => window.location.assign(path)) {
  if (event.key !== 'token' && event.key !== null) return; // null = localStorage.clear()
  if (event.key === 'token' && event.oldValue === event.newValue) return;
  const token = event.key === null ? null : event.newValue;
  go(token ? '/campaigns' : '/login');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    authService.getCurrentUser().then(result => {
      if (result.success) setUser(result.data);
      else localStorage.removeItem('token');
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const onStorage = (event) => redirectOnTokenChange(event);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function logout() {
    authService.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
