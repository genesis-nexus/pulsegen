import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { automationApi } from '../lib/api';
import type { IndustryPersona } from '../types';
import {
  LogOut,
  Zap,
  Play,
  Building2,
  Users,
  FileText,
  Clock,
  TrendingUp
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [personas, setPersonas] = useState<IndustryPersona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      setIsLoading(true);
      const data = await automationApi.getPersonas();
      setPersonas(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load personas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSelectPersona = (personaId: string) => {
    navigate('/automation', { state: { personaId } });
  };

  // Group personas by industry
  const personasByIndustry = personas.reduce((acc, persona) => {
    if (!acc[persona.industry]) {
      acc[persona.industry] = [];
    }
    acc[persona.industry].push(persona);
    return acc;
  }, {} as Record<string, IndustryPersona[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-primary-600 rounded-full p-2 mr-3">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PulseGen Automation Tool</h1>
                <p className="text-sm text-gray-600">Survey Configuration & Testing</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Welcome to Survey Automation</h2>
          <p className="text-primary-100 text-lg mb-6">
            Select an industry persona below to automatically configure PulseGen, create a
            comprehensive survey, and generate 20 sample responses for analysis.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Building2 className="w-8 h-8 mb-2" />
              <p className="text-sm font-medium">10 Industries</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <Users className="w-8 h-8 mb-2" />
              <p className="text-sm font-medium">20 Sample Users</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <FileText className="w-8 h-8 mb-2" />
              <p className="text-sm font-medium">Custom Surveys</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <TrendingUp className="w-8 h-8 mb-2" />
              <p className="text-sm font-medium">Full Analytics</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Personas Grid */}
        {!isLoading && !error && (
          <div className="space-y-8">
            {Object.entries(personasByIndustry).map(([industry, industryPersonas]) => (
              <div key={industry}>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-primary-600" />
                  {industry}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {industryPersonas.map((persona) => (
                    <div
                      key={persona.id}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
                    >
                      <div className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {persona.name}
                        </h4>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {persona.description}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-700">
                            <Users className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{persona.targetAudience}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-700">
                            <FileText className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{persona.typicalQuestions.length} Questions</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-700">
                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                            <span>~{Math.floor(persona.responsePatterns.averageTime / 60)} min avg</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-700">
                            <TrendingUp className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{persona.responsePatterns.completionRate}% completion</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-500 mb-2">Topics:</p>
                          <div className="flex flex-wrap gap-1">
                            {persona.surveyTopics.slice(0, 3).map((topic, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
                              >
                                {topic}
                              </span>
                            ))}
                            {persona.surveyTopics.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{persona.surveyTopics.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectPersona(persona.id)}
                          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Run Automation
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
