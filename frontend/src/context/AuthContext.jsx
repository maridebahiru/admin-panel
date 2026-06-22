import { createContext, useState, useEffect, useContext, useRef } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const logoutTimerRef = useRef(null);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expiry');
    
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  // Validate session on mount
  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const expiry = localStorage.getItem('token_expiry');

      if (storedToken && storedUser && expiry) {
        const now = Date.now();
        if (now > parseInt(expiry, 10)) {
          // Token expired
          console.warn('Session expired after 24 hours.');
          logout();
        } else {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          
          // Setup a timer to auto-logout when the remainder of the 24 hours is up
          const timeLeft = parseInt(expiry, 10) - now;
          if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
          logoutTimerRef.current = setTimeout(() => {
            console.warn('Session expired. Auto-logging out.');
            logout();
          }, timeLeft);
        }
      }
      setLoading(false);
    };

    checkAuth();
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: apiToken, user: apiUser } = response.data;

      // 24 hour expiry timestamp
      const expiryTime = Date.now() + 24 * 60 * 60 * 1000;

      localStorage.setItem('token', apiToken);
      localStorage.setItem('user', JSON.stringify(apiUser));
      localStorage.setItem('token_expiry', expiryTime.toString());

      setToken(apiToken);
      setUser(apiUser);
      setIsAuthenticated(true);

      // Setup a timer to auto-logout when the 24 hours is up
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = setTimeout(() => {
        console.warn('Session expired. Auto-logging out.');
        logout();
      }, 24 * 60 * 60 * 1000);

      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Authentication failed';
      return { success: false, error: errMsg };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return { success: true, message: response.data.message };
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Password reset request failed';
      return { success: false, error: errMsg };
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    forgotPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
