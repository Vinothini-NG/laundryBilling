'use client';

import { create } from 'zustand';
import type { AuthUser } from './types';
import { api, setToken } from './api';

interface AuthState {
  user: AuthUser | null;
  ready: boolean; // finished the initial token check
  setUser: (u: AuthUser | null) => void;
  bootstrap: () => Promise<void>;
  login: (accessToken: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,

  setUser: (user) => set({ user }),

  bootstrap: async () => {
    try {
      const { data } = await api.get<AuthUser>('/auth/me');
      set({ user: data, ready: true });
    } catch {
      set({ user: null, ready: true });
    }
  },

  login: (accessToken, user) => {
    setToken(accessToken);
    set({ user });
  },

  logout: () => {
    setToken(null);
    set({ user: null });
    if (typeof window !== 'undefined') window.location.href = '/login';
  },
}));
