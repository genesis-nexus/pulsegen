import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';
import { act } from '@testing-library/react';

// Reset store state before each test
beforeEach(() => {
  // Reset the store to initial state
  useAuthStore.setState({
    user: null,
    isLoading: true,
  });
  // Clear localStorage
  localStorage.clear();
});

describe('authStore', () => {
  describe('initial state', () => {
    it('starts with null user', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it('starts with isLoading true', () => {
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(true);
    });
  });

  describe('setUser', () => {
    it('sets user and stops loading', () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'MANAGER' as const,
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        useAuthStore.getState().setUser(mockUser);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isLoading).toBe(false);
    });

    it('clears user when set to null', () => {
      // First set a user
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'MANAGER' as const,
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        useAuthStore.getState().setUser(mockUser);
      });

      // Then clear it
      act(() => {
        useAuthStore.getState().setUser(null);
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('logs in successfully with valid credentials', async () => {
      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'password123');
      });

      const state = useAuthStore.getState();
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('test@example.com');
      expect(state.isLoading).toBe(false);

      // Check tokens are stored
      expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
    });

    it('throws error with invalid credentials', async () => {
      await expect(
        act(async () => {
          await useAuthStore.getState().login('test@example.com', 'wrongpassword');
        })
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });
  });

  describe('register', () => {
    it('registers successfully', async () => {
      await act(async () => {
        await useAuthStore.getState().register(
          'newuser@example.com',
          'password123',
          'New',
          'User'
        );
      });

      const state = useAuthStore.getState();
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('newuser@example.com');
      expect(state.isLoading).toBe(false);

      // Check tokens are stored
      expect(localStorage.getItem('accessToken')).toBeTruthy();
      expect(localStorage.getItem('refreshToken')).toBeTruthy();
    });

    it('throws error when email already exists', async () => {
      await expect(
        act(async () => {
          await useAuthStore.getState().register('existing@example.com', 'password123');
        })
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('clears user and tokens on logout', async () => {
      // First login
      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'password123');
      });

      // Then logout
      await act(async () => {
        await useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('handles logout when not logged in', async () => {
      await act(async () => {
        await useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });
  });

  describe('checkAuth', () => {
    it('sets user when valid token exists', async () => {
      localStorage.setItem('accessToken', 'mock-access-token');

      await act(async () => {
        await useAuthStore.getState().checkAuth();
      });

      const state = useAuthStore.getState();
      expect(state.user).not.toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('clears state when no token exists', async () => {
      await act(async () => {
        await useAuthStore.getState().checkAuth();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('clears state when token is invalid', async () => {
      localStorage.setItem('accessToken', 'invalid-token');

      // This will fail because MSW returns 401 for invalid tokens
      await act(async () => {
        await useAuthStore.getState().checkAuth();
      });

      const state = useAuthStore.getState();
      // Should handle the error gracefully
      expect(state.isLoading).toBe(false);
    });
  });

  describe('state persistence', () => {
    it('maintains state across multiple updates', async () => {
      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'password123');
      });

      const state1 = useAuthStore.getState();
      const userId = state1.user?.id;

      // Get state again - should be same
      const state2 = useAuthStore.getState();
      expect(state2.user?.id).toBe(userId);
    });
  });
});
