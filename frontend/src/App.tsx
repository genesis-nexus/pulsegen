import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from './stores/authStore';
import { UserRole } from './types';

// Layouts (kept eager — needed on first paint for every page)
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';

// Pages are lazy-loaded so each route ships as its own chunk instead of one
// monolithic bundle (recharts alone is several hundred KB and only analytics needs it).
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SurveyList = lazy(() => import('./pages/surveys/SurveyList'));
const SurveyBuilder = lazy(() => import('./pages/surveys/SurveyBuilder'));
const SurveyAnalytics = lazy(() => import('./pages/surveys/SurveyAnalytics'));
const SurveyParticipants = lazy(() => import('./pages/surveys/SurveyParticipants'));
const AIBuilder = lazy(() => import('./pages/surveys/AIBuilder'));
const SurveyWizard = lazy(() => import('./pages/surveys/SurveyWizard'));
const CreateWithAI = lazy(() => import('./pages/surveys/CreateWithAI'));
const CreateSurvey = lazy(() => import('./pages/surveys/CreateSurvey'));
const SurveyTemplates = lazy(() => import('./pages/surveys/SurveyTemplates'));
const SurveyTake = lazy(() => import('./pages/public/SurveyTake'));
const AISettings = lazy(() => import('./pages/settings/AISettings'));
const AIToolsSettings = lazy(() => import('./pages/settings/AIToolsSettings'));
const AIUsage = lazy(() => import('./pages/settings/AIUsage'));
const MLFeaturesSettings = lazy(() => import('./pages/settings/MLFeaturesSettings'));
const SSOSettings = lazy(() => import('./pages/settings/SSOSettings'));
const SMTPSettings = lazy(() => import('./pages/settings/SMTPSettings'));
const BrandingSettings = lazy(() => import('./pages/settings/BrandingSettings'));
const MLModels = lazy(() => import('./pages/ml/MLModels'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const AIChat = lazy(() => import('./pages/AIChat'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin Pages
const AutomationDashboard = lazy(() => import('./pages/automation/AutomationDashboard'));
const AutomationRunner = lazy(() => import('./pages/automation/AutomationRunner'));
const AutomationResults = lazy(() => import('./pages/automation/AutomationResults'));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-slate-400 dark:text-slate-500">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" />;
  }
  if (user.role !== UserRole.ADMIN) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
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
        <Route path="/surveys/create" element={<CreateSurvey />} />
        <Route path="/surveys/templates" element={<SurveyTemplates />} />
        <Route path="/surveys/create-ai" element={<CreateWithAI />} />
        <Route path="/surveys/ai-builder" element={<AIBuilder />} />
        <Route path="/surveys/ai-wizard" element={<SurveyWizard />} />
        <Route path="/surveys/new" element={<SurveyBuilder />} />
        <Route path="/surveys/:id/edit" element={<SurveyBuilder />} />
        <Route path="/surveys/:id/analytics" element={<SurveyAnalytics />} />

        <Route path="/surveys/:id/participants" element={<SurveyParticipants />} />
        <Route path="/ml/models" element={<MLModels />} />
        <Route path="/ai/chat" element={<AIChat />} />
        <Route path="/settings/ai" element={<AISettings />} />
        <Route path="/settings/ai-tools" element={<AIToolsSettings />} />
        <Route path="/settings/ai-usage" element={<AIUsage />} />
        <Route path="/settings/ml-features" element={<MLFeaturesSettings />} />
        <Route path="/settings/sso" element={<SSOSettings />} />
        <Route path="/settings/smtp" element={<SMTPSettings />} />
        <Route path="/settings/branding" element={<BrandingSettings />} />
        <Route path="/admin/users" element={<UserManagement />} />

        {/* Admin routes */}
        <Route
          path="/admin/automation"
          element={
            <AdminRoute>
              <AutomationDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/automation/run"
          element={
            <AdminRoute>
              <AutomationRunner />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/automation/results/:surveyId"
          element={
            <AdminRoute>
              <AutomationResults />
            </AdminRoute>
          }
        />
      </Route >

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

export default App;
