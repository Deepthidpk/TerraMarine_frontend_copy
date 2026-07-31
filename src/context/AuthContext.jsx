import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('terramarine_token') || null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('terramarine_token');
      if (storedToken) {
        try {
          const res = await fetch(`${API_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setToken(storedToken);
          } else {
            // Token expired or invalid
            logout();
          }
        } catch (err) {
          console.error('Auth verification failed:', err);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

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
    return res;
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
    authFetch,
    API_URL
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
