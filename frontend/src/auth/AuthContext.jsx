import { createContext, useContext, useState, useEffect } from 'react';
import authService from './authService';

const AuthContext = createContext(null);

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
