import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from './themeStore';
import { act } from '@testing-library/react';

// Reset store state before each test
beforeEach(() => {
  // Reset the store to initial state
  useThemeStore.setState({
    theme: 'system',
    isDark: false,
  });
  // Clear localStorage
  localStorage.clear();
  // Reset document classes
  document.documentElement.classList.remove('dark');
});

describe('themeStore', () => {
  describe('initial state', () => {
    it('starts with system theme', () => {
      const state = useThemeStore.getState();
      expect(state.theme).toBe('system');
    });

    it('starts with isDark false', () => {
      const state = useThemeStore.getState();
      expect(state.isDark).toBe(false);
    });
  });

  describe('setTheme', () => {
    it('sets dark theme', () => {
      act(() => {
        useThemeStore.getState().setTheme('dark');
      });

      const state = useThemeStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.isDark).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('sets light theme', () => {
      // First set to dark
      act(() => {
        useThemeStore.getState().setTheme('dark');
      });

      // Then set to light
      act(() => {
        useThemeStore.getState().setTheme('light');
      });

      const state = useThemeStore.getState();
      expect(state.theme).toBe('light');
      expect(state.isDark).toBe(false);
      expect(localStorage.getItem('theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('sets system theme', () => {
      act(() => {
        useThemeStore.getState().setTheme('system');
      });

      const state = useThemeStore.getState();
      expect(state.theme).toBe('system');
      expect(localStorage.getItem('theme')).toBe('system');
      // isDark depends on system preference (mocked to false in setup)
    });
  });

  describe('toggleTheme', () => {
    it('toggles from light to dark', () => {
      // Start with light
      act(() => {
        useThemeStore.getState().setTheme('light');
      });

      // Toggle
      act(() => {
        useThemeStore.getState().toggleTheme();
      });

      const state = useThemeStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.isDark).toBe(true);
    });

    it('toggles from dark to light', () => {
      // Start with dark
      act(() => {
        useThemeStore.getState().setTheme('dark');
      });

      // Toggle
      act(() => {
        useThemeStore.getState().toggleTheme();
      });

      const state = useThemeStore.getState();
      expect(state.theme).toBe('light');
      expect(state.isDark).toBe(false);
    });
  });

  describe('initTheme', () => {
    it('uses saved theme from localStorage', () => {
      localStorage.setItem('theme', 'dark');

      act(() => {
        useThemeStore.getState().initTheme();
      });

      const state = useThemeStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.isDark).toBe(true);
    });

    it('defaults to system when no saved theme', () => {
      act(() => {
        useThemeStore.getState().initTheme();
      });

      const state = useThemeStore.getState();
      expect(state.theme).toBe('system');
    });

    it('applies dark class to document when dark theme', () => {
      localStorage.setItem('theme', 'dark');

      act(() => {
        useThemeStore.getState().initTheme();
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class from document when light theme', () => {
      // First add the class
      document.documentElement.classList.add('dark');

      localStorage.setItem('theme', 'light');

      act(() => {
        useThemeStore.getState().initTheme();
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('DOM updates', () => {
    it('adds dark class when setting dark theme', () => {
      act(() => {
        useThemeStore.getState().setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class when setting light theme', () => {
      document.documentElement.classList.add('dark');

      act(() => {
        useThemeStore.getState().setTheme('light');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('localStorage persistence', () => {
    it('persists theme choice to localStorage', () => {
      act(() => {
        useThemeStore.getState().setTheme('dark');
      });

      expect(localStorage.getItem('theme')).toBe('dark');

      act(() => {
        useThemeStore.getState().setTheme('light');
      });

      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('restores theme from localStorage on init', () => {
      localStorage.setItem('theme', 'dark');

      act(() => {
        useThemeStore.getState().initTheme();
      });

      const state = useThemeStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.isDark).toBe(true);
    });
  });
});
