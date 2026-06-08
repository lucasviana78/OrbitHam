import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  clear: () => void;
}

/**
 * Holds the authenticated user's profile (from /auth/me).
 * The session itself lives in an HttpOnly cookie — no token is persisted here.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}));
