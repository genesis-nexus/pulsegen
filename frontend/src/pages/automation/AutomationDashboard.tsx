import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { automationApi } from '../../lib/api';
import type { IndustryPersona } from '../../types';
import {
  Zap,
  Play,
  Building2,
  Users,
  FileText,
  Clock,
  TrendingUp
} from 'lucide-react';

export default function AutomationDashboard() {
  const navigate = useNavigate();
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

  const handleSelectPersona = (personaId: string) => {
    navigate('/admin/automation/run', { state: { personaId } });
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-8 mb-8">
        <div className="flex items-center mb-4">
          <div className="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-2 mr-3">
            <Zap className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Survey Automation</h2>
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-lg mb-6">
          Select an industry persona below to automatically configure PulseGen, create a
          comprehensive survey, and generate sample responses for analysis.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <Building2 className="w-8 h-8 mb-2 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">10 Industries</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <Users className="w-8 h-8 mb-2 text-purple-600 dark:text-purple-400" />
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">20 Sample Users</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <FileText className="w-8 h-8 mb-2 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-900 dark:text-green-100">Custom Surveys</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <TrendingUp className="w-8 h-8 mb-2 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Full Analytics</p>
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Personas Grid */}
      {!isLoading && !error && (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-200 dark:border-slate-700 flex flex-col h-full"
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                    {persona.industry}
                  </span>
                </div>

                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {persona.name}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 flex-grow">
                  {persona.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                    <Users className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" />
                    <span>{persona.targetAudience}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                    <FileText className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" />
                    <span>{persona.typicalQuestions.length} Questions</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                    <Clock className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" />
                    <span>~{Math.floor(persona.responsePatterns.averageTime / 60)} min avg</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                    <TrendingUp className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" />
                    <span>{persona.responsePatterns.completionRate}% completion</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Topics:</p>
                  <div className="flex flex-wrap gap-1">
                    {persona.surveyTopics.slice(0, 3).map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                    {persona.surveyTopics.length > 3 && (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                        +{persona.surveyTopics.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPersona(persona.id)}
                  className="w-full mt-auto btn btn-primary"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Automation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
