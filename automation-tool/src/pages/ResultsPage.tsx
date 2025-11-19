import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveysApi, automationApi } from '../lib/api';
import {
  ArrowLeft,
  Users,
  FileText,
  Clock,
  TrendingUp,
  Download,
  ExternalLink
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ResultsPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (surveyId) {
      loadData();
    }
  }, [surveyId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [surveyData, analyticsData, statusData] = await Promise.all([
        surveysApi.getSurvey(surveyId!),
        surveysApi.getAnalytics(surveyId!),
        automationApi.getAutomationStatus(surveyId!)
      ]);

      setSurvey(surveyData);
      setAnalytics(analyticsData);
      setStatus(statusData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ survey, analytics, status }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `survey-${surveyId}-results.json`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error || 'Survey not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:3000';
  const surveyUrl = `${appUrl}/s/${survey.slug}`;

  // Prepare chart data
  const questionTypeData = analytics?.questionTypeDistribution || [];
  const responseRateData = [
    { name: 'Completed', value: analytics?.completionRate || 0 },
    { name: 'Incomplete', value: 100 - (analytics?.completionRate || 0) }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
              <p className="text-sm text-gray-600">{survey.description}</p>
            </div>
            <div className="flex space-x-3">
              <a
                href={surveyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 text-sm text-primary-600 hover:text-primary-700 border border-primary-600 rounded-lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Survey
              </a>
              <button
                onClick={handleExportData}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Responses</p>
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{status?.responseCount || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Questions</p>
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{status?.questionCount || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Avg Time</p>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {analytics?.averageCompletionTime ? `${Math.floor(analytics.averageCompletionTime / 60)}m` : 'N/A'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Completion Rate</p>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {analytics?.completionRate ? `${analytics.completionRate.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Completion Rate */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Completion</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={responseRateData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {responseRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Question Type Distribution */}
          {questionTypeData.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Types</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={questionTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Question Details */}
        {analytics?.questionStats && analytics.questionStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Statistics</h3>
            <div className="space-y-6">
              {analytics.questionStats.map((stat: any, idx: number) => (
                <div key={idx} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Q{idx + 1}: {stat.questionText}
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Type</p>
                      <p className="font-medium text-gray-900">{stat.type}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Responses</p>
                      <p className="font-medium text-gray-900">{stat.responseCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Average</p>
                      <p className="font-medium text-gray-900">
                        {stat.averageValue ? stat.averageValue.toFixed(2) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {stat.optionStats && stat.optionStats.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-600 mb-2">Response Distribution:</p>
                      <div className="space-y-2">
                        {stat.optionStats.map((option: any, optIdx: number) => (
                          <div key={optIdx} className="flex items-center">
                            <div className="w-32 text-xs text-gray-600 truncate">{option.text}</div>
                            <div className="flex-1 mx-2">
                              <div className="bg-gray-200 rounded-full h-4">
                                <div
                                  className="bg-primary-600 h-4 rounded-full"
                                  style={{ width: `${option.percentage}%` }}
                                />
                              </div>
                            </div>
                            <div className="w-16 text-right text-xs text-gray-600">
                              {option.count} ({option.percentage.toFixed(1)}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-4">Automation Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-primary-100 text-sm mb-1">Survey ID</p>
              <p className="font-mono text-sm">{survey.id}</p>
            </div>
            <div>
              <p className="text-primary-100 text-sm mb-1">Survey Slug</p>
              <p className="font-mono text-sm">{survey.slug}</p>
            </div>
            <div>
              <p className="text-primary-100 text-sm mb-1">Created</p>
              <p className="text-sm">{new Date(survey.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-primary-100 text-sm mb-1">Status</p>
              <p className="text-sm uppercase">{survey.status}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
