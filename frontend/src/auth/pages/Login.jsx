import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../authService';
import { useAuth } from '../AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error on input
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      // Login
      const result = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        const userResult = await authService.getCurrentUser();
        if (userResult.success) {
          setUser(userResult.data);
          navigate('/campaigns');
        } else {
          setError('Failed to load user data');
        }
      } else {
        setError(result.error);
      }
    } else {
      // Register
      const result = await authService.register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });

      if (result.success) {
        // Auto-login after registration
        const loginResult = await authService.login({
          email: formData.email,
          password: formData.password,
        });

        if (loginResult.success) {
          const userResult = await authService.getCurrentUser();
          if (userResult.success) {
            setUser(userResult.data);
            navigate('/campaigns');
          }
        }
      } else {
        setError(result.error);
      }
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ email: '', username: '', password: '' });
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="background-overlay"></div>
      </div>

      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">The Adventurer's Codex</h1>
          <p className="login-subtitle">Your digital companion for epic tales</p>
        </div>

        <div className="login-card">
          <div className="mode-toggle">
            <button
              className={`mode-button ${isLogin ? 'active' : ''}`}
              onClick={() => !isLogin && toggleMode()}
            >
              Login
            </button>
            <button
              className={`mode-button ${!isLogin ? 'active' : ''}`}
              onClick={() => isLogin && toggleMode()}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 4V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="8" cy="12" r="0.5" fill="currentColor"/>
                </svg>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="adventurer@example.com"
                autoComplete="email"
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  placeholder="Choose your adventurer name"
                  autoComplete="username"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your secret passphrase"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                isLogin ? 'Enter the Realm' : 'Begin Your Journey'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              {isLogin ? "New adventurer? " : "Already have an account? "}
              <button onClick={toggleMode} className="toggle-link">
                {isLogin ? "Create an account" : "Login here"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;