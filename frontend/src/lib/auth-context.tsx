'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getTokens, setTokens, clearTokens, apiFetch } from './api';

interface DecodedToken {
  sub: string;
  role: string;
  kontak: string;
  exp: number;
}

interface AuthUser {
  id: string;
  role: string;
  kontak: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (kontak: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeUser(accessToken: string): AuthUser {
  const decoded = jwtDecode<DecodedToken>(accessToken);
  return { id: decoded.sub, role: decoded.role, kontak: decoded.kontak };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const { accessToken, refreshToken } = getTokens();
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode<DecodedToken>(accessToken);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (!isExpired) {
          setUser(decodeUser(accessToken));
          setLoading(false);
          return;
        }

        if (refreshToken) {
          try {
            const data = await apiFetch('/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false });
            setTokens(data.accessToken, refreshToken);
            setUser(decodeUser(data.accessToken));
            setLoading(false);
            return;
          } catch {
            clearTokens();
          }
        } else {
          clearTokens();
        }
      } catch {
        clearTokens();
      }
      setLoading(false);
    }

    initAuth();

    const interval = setInterval(async () => {
      const { refreshToken } = getTokens();
      if (!refreshToken) return;
      try {
        const data = await apiFetch('/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false });
        setTokens(data.accessToken, refreshToken);
      } catch {
        // biarkan saja, nanti ketahuan pas request API berikutnya gagal
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  async function login(kontak: string, password: string) {
    const data = await apiFetch('/auth/login', { method: 'POST', body: { kontak, password }, auth: false });
    setTokens(data.accessToken, data.refreshToken);
    setUser(decodeUser(data.accessToken));
  }

  async function register(payload: Record<string, unknown>) {
    const data = await apiFetch('/auth/register', { method: 'POST', body: payload, auth: false });
    setTokens(data.accessToken, data.refreshToken);
    setUser(decodeUser(data.accessToken));
  }

  async function logout() {
    const { refreshToken } = getTokens();
    if (refreshToken) {
      await apiFetch('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => {});
    }
    clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}