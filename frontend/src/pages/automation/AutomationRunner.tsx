import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { automationApi } from '../../lib/api';
import type { IndustryPersona, AutomationConfig, AutomationResult } from '../../types';
import {
  ArrowLeft,
  Play,
  Loader,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Users,
  FileText,
  BarChart3
} from 'lucide-react';

export default function AutomationRunner() {
  const navigate = useNavigate();
  const location = useLocation();
  const personaIdFromState = (location.state as any)?.personaId;

  const [persona, setPersona] = useState<IndustryPersona | null>(null);
  const [config, setConfig] = useState<AutomationConfig>({
    personaId: personaIdFromState || '',
    scenarioCount: 20,
    useAI: false,
    includeLogic: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPersona, setLoadingPersona] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AutomationResult | null>(null);
  const [progress, setProgress] = useState<string>('');

  useEffect(() => {
    if (config.personaId) {
      loadPersona(config.personaId);
    } else {
      setLoadingPersona(false);
    }
  }, [config.personaId]);

  const loadPersona = async (personaId: string) => {
    try {
      setLoadingPersona(true);
      const data = await automationApi.getPersona(personaId);
      setPersona(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load persona');
    } finally {
      setLoadingPersona(false);
    }
  };

  const handleRunAutomation = async () => {
    if (!persona) return;

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setProgress('Initializing automation...');

      // Simulate progress updates
      setTimeout(() => setProgress('Creating survey...'), 1000);
      setTimeout(() => setProgress('Generating user scenarios...'), 3000);
      setTimeout(() => setProgress('Simulating responses...'), 5000);
      setTimeout(() => setProgress('Calculating analytics...'), 15000);

      const automationResult = await automationApi.runAutomation(config);

      setResult(automationResult);
      setProgress('Automation completed successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Automation failed');
      setProgress('');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingPersona) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-900 mb-4">Persona not found</p>
          <Link
            to="/admin/automation"
            className="text-primary-600 hover:text-primary-700"
          >
            Return to Automation Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Link
        to="/admin/automation"
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Automation Dashboard
      </Link>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{persona.name}</h1>
        <p className="text-sm text-gray-600">{persona.industry} • {persona.description}</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Survey Title (Optional)
                </label>
                <input
                  type="text"
                  value={config.surveyTitle || ''}
                  onChange={(e) => setConfig({ ...config, surveyTitle: e.target.value })}
                  placeholder={`${persona.name} - Automated`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Scenarios
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.scenarioCount}
                  onChange={(e) => setConfig({ ...config, scenarioCount: parseInt(e.target.value) || 20 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Generate 1-100 user scenarios</p>
              </div>

              <div className="flex items-center">
                <input
                  id="useAI"
                  type="checkbox"
                  checked={config.useAI}
                  onChange={(e) => setConfig({ ...config, useAI: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="useAI" className="ml-2 block text-sm text-gray-700">
                  Use AI for survey generation
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="includeLogic"
                  type="checkbox"
                  checked={config.includeLogic}
                  onChange={(e) => setConfig({ ...config, includeLogic: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="includeLogic" className="ml-2 block text-sm text-gray-700">
                  Include skip logic
                </label>
              </div>
            </div>

            <button
              onClick={handleRunAutomation}
              disabled={isLoading}
              className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Run Automation
                </>
              )}
            </button>

            {progress && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">{progress}</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Details & Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Persona Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Persona Details</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Target Audience</h3>
                <p className="text-sm text-gray-600">{persona.targetAudience}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Survey Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {persona.surveyTopics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Typical Questions</h3>
                <ul className="space-y-2">
                  {persona.typicalQuestions.map((question, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      {question}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Response Patterns</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Completion Rate</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {persona.responsePatterns.completionRate}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Avg Time</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {Math.floor(persona.responsePatterns.averageTime / 60)}m
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Questions</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {persona.typicalQuestions.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Automation Results</h2>
              </div>

              <div className="space-y-6">
                {/* Survey Created */}
                <div className="border-l-4 border-primary-500 pl-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Survey Created
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{result.survey.title}</p>
                  <p className="text-xs text-gray-500 mb-2">
                    {result.survey.questionCount} questions • ID: {result.survey.surveyId}
                  </p>
                  <a
                    href={result.survey.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    View Survey
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>

                {/* Responses Generated */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Responses Generated
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <p className="text-xs text-gray-600">Total Responses</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {result.summary.totalResponses}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Completed</p>
                      <p className="text-2xl font-semibold text-green-600">
                        {result.summary.completedResponses}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Avg Time</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {Math.floor(result.summary.averageCompletionTime / 60)}m
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {result.summary.completionRate}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Analytics */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics Available
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    View detailed analytics and insights for this survey
                  </p>
                  <button
                    onClick={() => navigate(`/admin/automation/results/${result.survey.surveyId}`)}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    View Analytics
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
