import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import SurveyList from './pages/surveys/SurveyList';
import SurveyBuilder from './pages/surveys/SurveyBuilder';
import SurveyAnalytics from './pages/surveys/SurveyAnalytics';
import SurveyTake from './pages/public/SurveyTake';
import AISettings from './pages/settings/AISettings';
import AIToolsSettings from './pages/settings/AIToolsSettings';
import SSOSettings from './pages/settings/SSOSettings';
import SMTPSettings from './pages/settings/SMTPSettings';
import BrandingSettings from './pages/settings/BrandingSettings';
import MLModels from './pages/ml/MLModels';
import UserManagement from './pages/admin/UserManagement';
import NotFound from './pages/NotFound';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/s/:slug" element={<SurveyTake />} />
      </Route>

      {/* Private routes */}
      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/surveys" element={<SurveyList />} />
        <Route path="/surveys/new" element={<SurveyBuilder />} />
        <Route path="/surveys/:id/edit" element={<SurveyBuilder />} />
        <Route path="/surveys/:id/analytics" element={<SurveyAnalytics />} />
        <Route path="/ml/models" element={<MLModels />} />
        <Route path="/settings/ai" element={<AISettings />} />
        <Route path="/settings/ai-tools" element={<AIToolsSettings />} />
        <Route path="/settings/sso" element={<SSOSettings />} />
        <Route path="/settings/smtp" element={<SMTPSettings />} />
        <Route path="/settings/branding" element={<BrandingSettings />} />
        <Route path="/admin/users" element={<UserManagement />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
