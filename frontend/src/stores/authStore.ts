import { create } from 'zustand';
import { apiFetch } from '../lib/api';
import { AuthUser, LoginResponseUser } from '../types/auth';

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loadMe: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

type MeResponse = {
  user: AuthUser;
};

type LoginResponse = {
  message: string;
  user: LoginResponseUser;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  async login(email: string, password: string) {
    set({ isLoading: true, error: null });

    try {
      const response = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      set({
        user: {
          userId: response.user.id,
          role: response.user.role,
          doctorProfileId: response.user.doctorProfileId,
          pharmacyProfileId: response.user.pharmacyProfileId,
          patientProfileId: response.user.patientProfileId,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
    }
  },

  async loadMe() {
    set({ isLoading: true });

    try {
      const response = await apiFetch<MeResponse>('/auth/me');
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  async logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError() {
    set({ error: null });
  },
}));
