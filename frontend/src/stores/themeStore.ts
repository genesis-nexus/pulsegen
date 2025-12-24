import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const getSystemTheme = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

const applyTheme = (isDark: boolean) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  isDark: false,

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);

    let isDark: boolean;
    if (theme === 'system') {
      isDark = getSystemTheme();
    } else {
      isDark = theme === 'dark';
    }

    applyTheme(isDark);
    set({ theme, isDark });
  },

  toggleTheme: () => {
    const { isDark } = get();
    const newTheme = isDark ? 'light' : 'dark';
    get().setTheme(newTheme);
  },

  initTheme: () => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const theme = savedTheme || 'system';

    let isDark: boolean;
    if (theme === 'system') {
      isDark = getSystemTheme();
    } else {
      isDark = theme === 'dark';
    }

    applyTheme(isDark);
    set({ theme, isDark });

    // Listen for system theme changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        const { theme } = get();
        if (theme === 'system') {
          applyTheme(e.matches);
          set({ isDark: e.matches });
        }
      });
    }
  },
}));
