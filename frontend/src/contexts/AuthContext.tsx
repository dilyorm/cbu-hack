import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../api/client';

interface User {
  username: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    const data = response.data;
    setToken(data.token);
    const u: User = {
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
    };
    setUser(u);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(u));
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, fullName: string) => {
    const response = await api.post('/auth/register', { username, email, password, fullName });
    const data = response.data;
    setToken(data.token);
    const u: User = {
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
    };
    setUser(u);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
