import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { syncLocalDraftsToSupabase } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AUTH_API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api/v1/auth`
  : '/api/v1/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('infynux_user');
    const token = localStorage.getItem('infynux_token');
    if (saved && token) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('infynux_token'));
  });

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('infynux_user');
      localStorage.removeItem('infynux_token');
    };

    window.addEventListener('infynux_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('infynux_unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    async function checkMe() {
      const token = localStorage.getItem('infynux_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`,
        };
        const res = await fetch(`${AUTH_API_BASE}/me`, {
          headers,
          credentials: 'include',
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data?.user) {
            setUser(json.data.user);
            localStorage.setItem('infynux_user', JSON.stringify(json.data.user));
            setIsLoading(false);
            syncLocalDraftsToSupabase();
            return;
          }
        }
      } catch (e) {
        console.error('Session check failed', e);
      }

      // If backend verification failed, session is invalid
      setUser(null);
      localStorage.removeItem('infynux_user');
      localStorage.removeItem('infynux_token');
      setIsLoading(false);
    }

    checkMe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${AUTH_API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'include',
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data?.user) {
          setUser(json.data.user);
          localStorage.setItem('infynux_user', JSON.stringify(json.data.user));
          if (json.data.token) {
            localStorage.setItem('infynux_token', json.data.token);
          }
          setIsLoading(false);
          syncLocalDraftsToSupabase();
          return true;
        }
      }
    } catch (err) {
      console.error('Login network error:', err);
    }

    setIsLoading(false);
    return false;
  };

  const logout = async () => {
    const token = localStorage.getItem('infynux_token');
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`${AUTH_API_BASE}/logout`, { method: 'POST', headers, credentials: 'include' });
    } catch {}
    setUser(null);
    localStorage.removeItem('infynux_user');
    localStorage.removeItem('infynux_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
