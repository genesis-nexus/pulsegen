import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  FileText,
  LogOut,
  Settings,
  Sparkles,
  Lock,
  Mail,
  Palette,
  TrendingUp,
  Database,
  MessageSquare,
  BarChart3,
  Zap,
  Users,
  Moon,
  Sun,
  Monitor,
  ChevronDown,
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { theme, isDark, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navLinkClass = (path: string) =>
    `nav-link ${isActive(path) ? 'nav-link-active' : ''}`;

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                  PulseGen
                </span>
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
                <Link to="/" className={navLinkClass('/')}>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <Link to="/surveys" className={navLinkClass('/surveys')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Surveys
                </Link>
                <Link to="/ml/models" className={navLinkClass('/ml')}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  ML Models
                </Link>
                <Link to="/ai/chat" className={navLinkClass('/ai/chat')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  AI Chat
                </Link>
                {user?.role === UserRole.ADMIN && (
                  <Link to="/admin/automation" className={navLinkClass('/admin/automation')}>
                    <Zap className="w-4 h-4 mr-2" />
                    Automation
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Toggle theme"
                >
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
                {showThemeMenu && (
                  <div className="dropdown-menu absolute right-0 mt-2 w-40 z-50">
                    <button
                      onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                      className={`dropdown-item w-full ${theme === 'light' ? 'text-primary-600 dark:text-primary-400' : ''}`}
                    >
                      <Sun className="w-4 h-4 mr-2" />
                      Light
                    </button>
                    <button
                      onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                      className={`dropdown-item w-full ${theme === 'dark' ? 'text-primary-600 dark:text-primary-400' : ''}`}
                    >
                      <Moon className="w-4 h-4 mr-2" />
                      Dark
                    </button>
                    <button
                      onClick={() => { setTheme('system'); setShowThemeMenu(false); }}
                      className={`dropdown-item w-full ${theme === 'system' ? 'text-primary-600 dark:text-primary-400' : ''}`}
                    >
                      <Monitor className="w-4 h-4 mr-2" />
                      System
                    </button>
                  </div>
                )}
              </div>

              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Settings
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                {showSettingsMenu && (
                  <div className="dropdown-menu absolute right-0 mt-2 w-56 z-50">
                    <div className="py-1">
                      <Link
                        to="/settings/ai"
                        className="dropdown-item"
                        onClick={() => setShowSettingsMenu(false)}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Providers
                      </Link>
                      <Link
                        to="/settings/ai-tools"
                        className="dropdown-item"
                        onClick={() => setShowSettingsMenu(false)}
                      >
                        <Database className="w-4 h-4 mr-2" />
                        AI Tools (MindsDB)
                      </Link>
                      <Link
                        to="/settings/ai-usage"
                        className="dropdown-item"
                        onClick={() => setShowSettingsMenu(false)}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        AI Usage
                      </Link>
                      <Link
                        to="/settings/sso"
                        className="dropdown-item"
                        onClick={() => setShowSettingsMenu(false)}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        SSO & Identity
                      </Link>
                      <Link
                        to="/settings/smtp"
                        className="dropdown-item"
                        onClick={() => setShowSettingsMenu(false)}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email (SMTP)
                      </Link>
                      <Link
                        to="/settings/branding"
                        className="dropdown-item"
                        onClick={() => setShowSettingsMenu(false)}
                      >
                        <Palette className="w-4 h-4 mr-2" />
                        Branding
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <Link
                          to="/admin/users"
                          className="dropdown-item"
                          onClick={() => setShowSettingsMenu(false)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          User Management
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User info */}
              <span className="text-sm text-slate-700 dark:text-slate-300 hidden sm:block">
                {user?.firstName || user?.email}
              </span>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Click outside to close menus */}
      {(showSettingsMenu || showThemeMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowSettingsMenu(false);
            setShowThemeMenu(false);
          }}
        />
      )}
    </div>
  );
}
