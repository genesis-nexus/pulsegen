import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LayoutDashboard, FileText, LogOut, Sparkles } from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/settings/ai"
                className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                AI Settings
              </Link>
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
      </nav>

      {/* Main content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
