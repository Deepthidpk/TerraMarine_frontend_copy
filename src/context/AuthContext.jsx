import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('terramarine_token') || null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


  useEffect(() => {
    let intervalId;

    const checkAuth = async () => {
      const storedToken = localStorage.getItem('terramarine_token') || token;
      if (storedToken) {
        try {
          const res = await fetch(`${API_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user?.status === 'Suspended') {
              logout();
              window.location.href = '/login?suspended=true';
            } else {
              setUser(data.user);
              setToken(storedToken);
            }
          } else {
            // Token expired, invalid or account suspended
            const errorData = await res.json().catch(() => ({}));
            logout();
            if (res.status === 403 || errorData.isSuspended) {
              window.location.href = '/login?suspended=true';
            }
          }
        } catch (err) {
          console.error('Auth verification failed:', err);
        }
      }
      setLoading(false);
    };

    checkAuth();

    if (token) {
      intervalId = setInterval(checkAuth, 4000); // Check every 4s for instant security enforcement
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [token]);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/notifications`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const handleDismissNotification = async (id) => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.notification_id !== id));
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/notifications`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      const notifInterval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(notifInterval);
    }
  }, [user, token]);

  const parseResponse = async (res) => {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    const text = await res.text();
    throw new Error(`Server response error (${res.status}): ${text || 'Non-JSON response'}`);
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await parseResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    localStorage.setItem('terramarine_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const isFormData = formData instanceof FormData;
    const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
    const body = isFormData ? formData : JSON.stringify(formData);

    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers,
      body
    });

    const data = await parseResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    return data;
  };

  const googleLogin = async (tokenValue) => {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenValue, credential: tokenValue })
    });

    const data = await parseResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Google login failed.');
    }

    if (!data.isNewUser && data.token) {
      localStorage.setItem('terramarine_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const completeGoogleRegistration = async (formData) => {
    const isFormData = formData instanceof FormData;
    const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
    const body = isFormData ? formData : JSON.stringify(formData);

    const res = await fetch(`${API_URL}/auth/google-complete`, {
      method: 'POST',
      headers,
      body
    });

    const data = await parseResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Registration completion failed.');
    }

    if (data.token) {
      localStorage.setItem('terramarine_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('terramarine_token');
    setToken(null);
    setUser(null);
  };

  // Helper fetch function that automatically appends auth tokens
  const authFetch = async (endpoint, options = {}) => {
    const headers = options.headers || {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Check if the body is FormData (e.g. file upload), do not set Content-Type header manually
    const isFormData = options.body instanceof FormData;
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const fetchOptions = {
      ...options,
      headers
    };

    const res = await fetch(`${API_URL}${endpoint}`, fetchOptions);

    if (res.status === 401 || res.status === 403) {
      try {
        const clonedRes = res.clone();
        const data = await clonedRes.json();
        if (data.isSuspended || (data.error && data.error.toLowerCase().includes('suspend'))) {
          logout();
          window.location.href = '/login?suspended=true';
        }
      } catch (e) {
        // Ignored
      }
    }

    return res;
  };

  const updateProfile = async (profileData) => {
    const res = await authFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });

    const data = await parseResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Profile update failed.');
    }

    if (data.user) {
      setUser(data.user);
    }
    return data.user;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    googleLogin,
    completeGoogleRegistration,
    logout,
    updateProfile,
    authFetch,
    API_URL,
    notifications,
    fetchNotifications,
    handleClearAllNotifications,
    handleDismissNotification,
    handleMarkAsRead,
    handleMarkAllAsRead
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
