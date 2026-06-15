/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { api, tokenStore, setOnUnauthorized } from '../lib/api';

interface AuthValue {
  authed: boolean;
  login: (email: string, password: string, totp?: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean>(!!tokenStore.access);

  const logout = useCallback(() => {
    tokenStore.clear();
    setAuthed(false);
  }, []);

  useEffect(() => setOnUnauthorized(() => setAuthed(false)), []);

  const login = useCallback(async (email: string, password: string, totp?: string) => {
    const { data } = await api.post('/auth/internal/login', { email, password, totp });
    tokenStore.set(data.accessToken, data.refreshToken);
    setAuthed(true);
  }, []);

  return <Ctx.Provider value={{ authed, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth hors AuthProvider');
  return c;
}
