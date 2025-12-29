/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand colors (indigo-violet gradient base)
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Accent (violet for gradients)
        accent: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        // Surface colors for cards and backgrounds
        surface: {
          // Light mode
          light: {
            DEFAULT: '#ffffff',
            secondary: '#f8fafc',
            tertiary: '#f1f5f9',
          },
          // Dark mode
          dark: {
            DEFAULT: '#1e293b',
            secondary: '#0f172a',
            tertiary: '#1e1b4b',
          },
        },
        // Border colors
        border: {
          light: '#e2e8f0',
          dark: '#334155',
        },
      },
      backgroundImage: {
        // Gradient backgrounds matching hero-banner.svg
        'gradient-dark': 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        'gradient-light': 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
        'gradient-accent': 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-accent-hover': 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.4)',
      },
    },
  },
  plugins: [],
}
