import { create } from 'zustand';
import { User, UserRole } from '../types/common';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  logout: () => {
    set({ user: null, token: null, error: null });
    localStorage.removeItem('token');
  },

  isAuthenticated: () => {
    const { user, token } = get();
    return !!(user && token);
  },

  hasRole: (role: UserRole) => {
    const { user } = get();
    return user?.role === role;
  },
}));
