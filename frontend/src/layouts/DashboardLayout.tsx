import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UserRole } from '../types';
import { LayoutDashboard, FileText, LogOut, Settings, Sparkles, Lock, Mail, Palette, TrendingUp, Database, MessageSquare, BarChart3, Zap, Users } from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold text-primary-600">PulseGen</span>
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <Link
                  to="/surveys"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Surveys
                </Link>
                <Link
                  to="/ml/models"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  ML Models
                </Link>
                <Link
                  to="/ai/chat"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  AI Chat
                </Link>
                {user?.role === UserRole.ADMIN && (
                  <Link
                    to="/admin/automation"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Automation
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Settings
                </button>
                {showSettingsMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <Link
                        to="/settings/ai"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowSettingsMenu(false)}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Providers
                      </Link>
                      <Link
                        to="/settings/ai-tools"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowSettingsMenu(false)}
                      >
                        <Database className="w-4 h-4 mr-2" />
                        AI Tools (MindsDB)
                      </Link>
                      <Link
                        to="/settings/ai-usage"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowSettingsMenu(false)}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        AI Usage
                      </Link>
                      <Link
                        to="/settings/sso"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowSettingsMenu(false)}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        SSO & Identity
                      </Link>
                      <Link
                        to="/settings/smtp"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowSettingsMenu(false)}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email (SMTP)
                      </Link>
                      <Link
                        to="/settings/branding"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowSettingsMenu(false)}
                      >
                        <Palette className="w-4 h-4 mr-2" />
                        Branding
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <Link
                          to="/admin/users"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
              <span className="text-sm text-gray-700">
                {user?.firstName || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav >

      {/* Main content */}
      < main >
        <Outlet />
      </main >
    </div >
  );
}
