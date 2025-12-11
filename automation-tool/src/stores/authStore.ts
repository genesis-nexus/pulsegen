import { create } from 'zustand';
import { authApi } from '../lib/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.login(email, password);
      const user = await authApi.getCurrentUser();
      set({ user, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Login failed',
        isLoading: false
      });
      throw error;
    }
  },

  register: async (email: string, password: string, firstName?: string, lastName?: string) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.register(email, password, firstName, lastName);
      const user = await authApi.getCurrentUser();
      set({ user, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Registration failed',
        isLoading: false
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ user: null, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await authApi.getCurrentUser();
      set({ user, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  clearError: () => set({ error: null }),
}));
