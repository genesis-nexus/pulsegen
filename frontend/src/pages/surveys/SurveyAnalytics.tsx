import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Sparkles, HelpCircle } from 'lucide-react';
import api from '../../lib/api';
import { Survey, Analytics, QuestionAnalytics } from '../../types';
import { SmartAnalyzer } from '../../components/ai';
import toast from 'react-hot-toast';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function SurveyAnalytics() {
  const { id } = useParams();
  const [isExporting, setIsExporting] = useState(false);
  const [showLogicInfo, setShowLogicInfo] = useState(false);

  const { data: survey } = useQuery({
    queryKey: ['survey', id],
    queryFn: async () => {
      const response = await api.get(`/surveys/${id}`);
      return response.data.data as Survey;
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', id],
    queryFn: async () => {
      const response = await api.get(`/analytics/surveys/${id}/summary`);
      return response.data.data as Analytics;
    },
  });

  const { data: questionAnalytics } = useQuery({
    queryKey: ['question-analytics', id],
    queryFn: async () => {
      const response = await api.get(`/analytics/surveys/${id}/questions`);
      return response.data.data as QuestionAnalytics[];
    },
  });

  const { data: insights } = useQuery({
    queryKey: ['insights', id],
    queryFn: async () => {
      const response = await api.get(`/analytics/surveys/${id}/insights`);
      return response.data.data;
    },
  });

  // Export function to generate CSV from responses
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      toast.loading('Exporting data...');

      // Fetch all responses for this survey
      const response = await api.get(`/responses/surveys/${id}`);
      console.log('Export response:', response);
      console.log('Response data:', response.data);

      const responses = response.data.data || response.data;

      console.log('Responses:', responses);
      console.log('Responses length:', responses?.length);

      if (!responses || responses.length === 0) {
        toast.dismiss();
        toast.error('No responses to export');
        return;
      }

      // Convert to CSV format
      const csv = convertResponsesToCSV(responses, survey);

      // Create and download CSV file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `survey-${survey?.title || id}-responses-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss();
      toast.success('Data exported successfully!');
    } catch (error: any) {
      console.error('Export error:', error);
      console.error('Error response:', error.response);
      toast.dismiss();
      toast.error(error.response?.data?.error || error.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to convert responses to CSV
  const convertResponsesToCSV = (responses: any[], survey: any) => {
    if (!survey || !survey.questions) return '';

    // Create header row
    const headers = ['Response ID', 'Submitted At', 'Completed', 'Duration (seconds)', 'IP Address'];
    survey.questions.forEach((q: any) => {
      headers.push(`Q${q.order + 1}: ${q.text.replace(/,/g, ';')}`);
    });

    // Create data rows
    const rows = responses.map((response: any) => {
      const row = [
        response.id,
        new Date(response.submittedAt).toLocaleString(),
        response.isComplete ? 'Yes' : 'No',
        response.duration || 'N/A',
        response.ipAddress || 'N/A'
      ];

      // Add answer for each question
      survey.questions.forEach((question: any) => {
        // For checkboxes, there may be multiple answers for the same question
        const answers = response.answers?.filter((a: any) => a.questionId === question.id) || [];

        if (answers.length === 0) {
          row.push('');
          return;
        }

        // Format answer based on type
        let answerText = '';

        if (answers.length === 1) {
          const answer = answers[0];
          if (answer.textValue) {
            answerText = String(answer.textValue).replace(/,/g, ';').replace(/\n/g, ' ');
          } else if (answer.numberValue !== null && answer.numberValue !== undefined) {
            answerText = String(answer.numberValue);
          } else if (answer.option) {
            answerText = answer.option.text;
          }
        } else {
          // Multiple answers (checkboxes)
          answerText = answers
            .map((a: any) => a.option?.text || a.textValue || '')
            .filter((text: string) => text)
            .join('; ');
        }

        row.push(answerText);
      });

      return row;
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">{survey?.title}</h1>
            <p className="text-gray-600">Survey Analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLogicInfo(!showLogicInfo)}
              className="inline-flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Logic Types
            </button>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="btn btn-primary inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>
        </div>

        {/* Logic Info Modal */}
        {showLogicInfo && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Survey Logic Types</h3>
              <button
                onClick={() => setShowLogicInfo(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Skip Logic</h4>
                <p className="text-sm text-gray-700">
                  Automatically skips questions based on previous answers. For example, if a user answers "No" to "Do you own a car?",
                  questions about car maintenance are skipped. The respondent never sees the skipped questions.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Branching Logic</h4>
                <p className="text-sm text-gray-700">
                  Routes respondents to different question paths or pages based on their answers. Similar to skip logic but operates
                  at a higher level, directing users to entirely different sections of the survey. Often used for complex surveys
                  with multiple paths.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Display Logic</h4>
                <p className="text-sm text-gray-700">
                  Shows or hides questions based on conditions, but doesn't skip them entirely. The question remains in the sequence,
                  but is only displayed when conditions are met. Useful for follow-up questions or conditional fields that should maintain
                  survey structure.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all">
          <p className="text-sm font-medium text-blue-700 mb-2">Total Responses</p>
          <p className="text-4xl font-bold text-blue-900">
            {analytics?.totalResponses || 0}
          </p>
          <div className="mt-2 h-1 bg-blue-300 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all">
          <p className="text-sm font-medium text-green-700 mb-2">Completion Rate</p>
          <p className="text-4xl font-bold text-green-900">
            {analytics?.completionRate?.toFixed(1) || 0}%
          </p>
          <div className="mt-2 h-1 bg-green-300 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${analytics?.completionRate || 0}%` }}></div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all">
          <p className="text-sm font-medium text-purple-700 mb-2">Avg. Duration</p>
          <p className="text-4xl font-bold text-purple-900">
            {analytics?.averageDuration ? `${Math.round(analytics.averageDuration / 60)}m` : 'N/A'}
          </p>
          <div className="mt-2 h-1 bg-purple-300 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all">
          <p className="text-sm font-medium text-orange-700 mb-2">Drop-off Rate</p>
          <p className="text-4xl font-bold text-orange-900">
            {analytics?.dropoffRate?.toFixed(1) || 0}%
          </p>
          <div className="mt-2 h-1 bg-orange-300 rounded-full overflow-hidden">
            <div className="h-full bg-orange-600 rounded-full transition-all" style={{ width: `${analytics?.dropoffRate || 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Smart AI Analyzer */}
      {survey && id && (
        <div className="mb-8">
          <SmartAnalyzer
            surveyId={id}
            surveyTitle={survey.title}
            analytics={analytics}
            responses={[]} // Responses are fetched in the component
            questions={survey.questions || []}
          />
        </div>
      )}

      {/* Stored AI Insights */}
      {insights && insights.length > 0 && (
        <div className="card mb-8">
          <div className="flex items-center mb-4">
            <Sparkles className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-xl font-bold">Previous AI Insights</h2>
          </div>
          <div className="space-y-4">
            {insights.map((insight: any) => (
              <div
                key={insight.id}
                className="p-4 bg-primary-50 border border-primary-200 rounded-lg"
              >
                <p className="text-gray-900">{insight.insight}</p>
                {insight.confidence && (
                  <p className="text-sm text-gray-600 mt-1">
                    Confidence: {(insight.confidence * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Analytics */}
      <div className="space-y-8">
        {questionAnalytics?.map((qa, qaIndex) => (
          <div key={qa.questionId} className="card bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl transition-shadow">
            <div className="mb-6">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">{qa.questionText}</h3>
                <span className="ml-4 px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                  {qa.totalResponses} responses
                </span>
              </div>
            </div>

            {qa.distribution && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Modern Bar Chart */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Response Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={qa.distribution}>
                      <defs>
                        <linearGradient id={`colorBar${qaIndex}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="optionText"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill={`url(#colorBar${qaIndex})`}
                        radius={[8, 8, 0, 0]}
                        animationDuration={1000}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Modern Donut Chart */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Percentage Breakdown</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <defs>
                        {COLORS.map((color, idx) => (
                          <linearGradient key={idx} id={`gradient${qaIndex}-${idx}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                            <stop offset="100%" stopColor={color} stopOpacity={1} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={qa.distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        labelLine={false}
                        label={(entry) => `${entry.percentage.toFixed(0)}%`}
                        fill="#8884d8"
                        dataKey="count"
                        animationDuration={1000}
                      >
                        {qa.distribution.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#gradient${qaIndex}-${index % COLORS.length})`}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(_value, entry: any) => (
                          <span className="text-sm text-gray-700">{entry.payload.optionText}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {qa.average !== undefined && (
              <div className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Average</p>
                    <p className="text-xl font-bold">{qa.average.toFixed(2)}</p>
                  </div>
                  {qa.median !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600">Median</p>
                      <p className="text-xl font-bold">{qa.median}</p>
                    </div>
                  )}
                  {qa.min !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600">Min</p>
                      <p className="text-xl font-bold">{qa.min}</p>
                    </div>
                  )}
                  {qa.max !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600">Max</p>
                      <p className="text-xl font-bold">{qa.max}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
