import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('civic360_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('civic360_token') || null);
  const [loading, setLoading] = useState(true);

  // Synchronize user profile on load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('civic360_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('civic360_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for unauthorized events from api.js
    const handleUnauthorized = () => logout();
    window.addEventListener('civic360:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('civic360:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.success) {
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('civic360_token', res.token);
      localStorage.setItem('civic360_user', JSON.stringify(res.user));
    }
    return res;
  };

  const loginDemo = async (persona) => {
    const res = await authService.loginDemo(persona);
    if (res.success) {
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('civic360_token', res.token);
      localStorage.setItem('civic360_user', JSON.stringify(res.user));
    }
    return res;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    if (res.success) {
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('civic360_token', res.token);
      localStorage.setItem('civic360_user', JSON.stringify(res.user));
    }
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('civic360_token');
    localStorage.removeItem('civic360_user');
  };

  const updateUserState = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('civic360_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        loginDemo,
        register,
        logout,
        updateUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
