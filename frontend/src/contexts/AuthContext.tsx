import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  authId: string;
  email: string;
  fullName: string;
  token: string;
  convexUserId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (sessionId: string) => Promise<void>;
  logout: () => Promise<void>;
  setConvexUserId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  setConvexUserId: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const stored = await AsyncStorage.getItem('sultan_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Verify token still works
        const resp = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${parsed.token}` },
        });
        if (resp.ok) {
          setUser(parsed);
        } else {
          await AsyncStorage.removeItem('sultan_auth');
        }
      }
    } catch (e) {
      // Token invalid or network error
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuth = async (u: User) => {
    setUser(u);
    await AsyncStorage.setItem('sultan_auth', JSON.stringify(u));
  };

  const register = async (fullName: string, email: string, password: string) => {
    const resp = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password }),
    });
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.detail || 'Registration failed');
    }
    const data = await resp.json();
    await saveAuth({
      authId: data.authId,
      email: data.email,
      fullName: data.fullName,
      token: data.token,
    });
  };

  const login = async (email: string, password: string) => {
    const resp = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.detail || 'Login failed');
    }
    const data = await resp.json();
    await saveAuth({
      authId: data.authId,
      email: data.email,
      fullName: data.fullName,
      token: data.token,
    });
  };

  const loginWithGoogle = async (sessionId: string) => {
    const resp = await fetch(`${BACKEND_URL}/api/auth/google-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    });
    if (!resp.ok) throw new Error('Google login failed');
    const data = await resp.json();
    await saveAuth({
      authId: data.authId,
      email: data.email,
      fullName: data.fullName,
      token: data.token,
    });
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('sultan_auth');
  };

  const setConvexUserId = (id: string) => {
    if (user) {
      const updated = { ...user, convexUserId: id };
      setUser(updated);
      AsyncStorage.setItem('sultan_auth', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, loginWithGoogle, logout, setConvexUserId }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
