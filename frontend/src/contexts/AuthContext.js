"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Plain t(), not useTranslation() - LanguageProvider reads useAuth(), so
// AuthProvider (above it) can't consume the Context without a circular
// dependency. Just fallback error strings, so Serbian-only is fine here.
import { t } from '../lib/translations';
import { API_URL } from '../lib/apiUrl';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Verify token with backend
      let response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Try a silent refresh before treating an expired session as logged
      // out - apiCall() already does this for every other request.
      if (response.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          });
        }
      }

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.data.user);
      } else {
        // Token is invalid and couldn't be refreshed, clear it
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
      setUser(data.data.user);
      return { success: true };
    } else {
      return { success: false, error: data.message || t('auth.loginFailed') };
    }
  };

  const register = async (userData) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
      setUser(data.data.user);
      return { success: true };
    } else {
      return { success: false, error: data.message || t('auth.registrationFailed') };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      router.push('/');
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const newAccessToken = data.data?.accessToken;
        if (!newAccessToken) {
          throw new Error('Token refresh failed');
        }
        localStorage.setItem('accessToken', newAccessToken);
        return newAccessToken;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return null;
    }
  };

  // API call helper with automatic token refresh
  const apiCall = async (url, options = {}) => {
    let token = localStorage.getItem('accessToken');
    
    const makeRequest = async (token) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    };

    let response = await makeRequest(token);

    // If token expired, try to refresh
    if (response.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        response = await makeRequest(newToken);
      }
    }

    return response;
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    apiCall,
    isAuthenticated,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
