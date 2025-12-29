import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Sparkles, HelpCircle, Users, Share2 } from 'lucide-react';
import api from '../../lib/api';
import { Survey, Analytics, QuestionAnalytics } from '../../types';
import { SmartAnalyzer } from '../../components/ai';
import { SourceAnalytics, SocialLinkGenerator } from '../../components/social';
import toast from 'react-hot-toast';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function SurveyAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [showLogicInfo, setShowLogicInfo] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);

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

  // Source analytics query
  const { data: sourceAnalytics } = useQuery({
    queryKey: ['source-analytics', id],
    queryFn: async () => {
      const response = await api.get(`/analytics/surveys/${id}/sources`);
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{survey?.title}</h1>
            <p className="text-slate-600 dark:text-slate-300">Survey Analytics</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/surveys/${id}/participants`)}
              className="btn btn-outline btn-sm"
            >
              <Users className="w-4 h-4 mr-1.5" />
              Participants
            </button>
            <button
              onClick={() => setShowSharePanel(!showSharePanel)}
              className={`btn btn-sm ${
                showSharePanel
                  ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700'
                  : 'btn-outline'
              }`}
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              Share
            </button>
            <button
              onClick={() => setShowLogicInfo(!showLogicInfo)}
              className="btn btn-outline btn-sm"
            >
              <HelpCircle className="w-4 h-4 mr-1.5" />
              Logic Types
            </button>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {isExporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>
        </div>

        {/* Share Panel */}
        {showSharePanel && survey && (
          <div className="mb-6">
            <SocialLinkGenerator
              surveyUrl={`${window.location.origin}/s/${survey.slug}`}
              surveyTitle={survey.title}
              surveyDescription={survey.description}
              onClose={() => setShowSharePanel(false)}
            />
          </div>
        )}

        {/* Logic Info Modal */}
        {showLogicInfo && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Survey Logic Types</h3>
              <button
                onClick={() => setShowLogicInfo(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Skip Logic</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Automatically skips questions based on previous answers. For example, if a user answers "No" to "Do you own a car?",
                  questions about car maintenance are skipped. The respondent never sees the skipped questions.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Branching Logic</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Routes respondents to different question paths or pages based on their answers. Similar to skip logic but operates
                  at a higher level, directing users to entirely different sections of the survey. Often used for complex surveys
                  with multiple paths.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Display Logic</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300">
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
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Total Responses</p>
          <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">
            {analytics?.totalResponses || 0}
          </p>
          <div className="mt-2 h-1 bg-blue-300 dark:bg-blue-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">Completion Rate</p>
          <p className="text-4xl font-bold text-emerald-900 dark:text-emerald-100">
            {analytics?.completionRate?.toFixed(1) || 0}%
          </p>
          <div className="mt-2 h-1 bg-emerald-300 dark:bg-emerald-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full transition-all" style={{ width: `${analytics?.completionRate || 0}%` }}></div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/50 dark:to-violet-900/30 border-violet-200 dark:border-violet-800 hover:shadow-lg transition-all">
          <p className="text-sm font-medium text-violet-700 dark:text-violet-300 mb-2">Avg. Duration</p>
          <p className="text-4xl font-bold text-violet-900 dark:text-violet-100">
            {analytics?.averageDuration ? `${Math.round(analytics.averageDuration / 60)}m` : 'N/A'}
          </p>
          <div className="mt-2 h-1 bg-violet-300 dark:bg-violet-800 rounded-full overflow-hidden">
            <div className="h-full bg-violet-600 dark:bg-violet-400 rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">Drop-off Rate</p>
          <p className="text-4xl font-bold text-amber-900 dark:text-amber-100">
            {analytics?.dropoffRate?.toFixed(1) || 0}%
          </p>
          <div className="mt-2 h-1 bg-amber-300 dark:bg-amber-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-600 dark:bg-amber-400 rounded-full transition-all" style={{ width: `${analytics?.dropoffRate || 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Source Analytics */}
      {sourceAnalytics && (
        <div className="mb-8">
          <SourceAnalytics
            data={sourceAnalytics}
            totalResponses={analytics?.totalResponses || 0}
          />
        </div>
      )}

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
            <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-2" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Previous AI Insights</h2>
          </div>
          <div className="space-y-4">
            {insights.map((insight: any) => (
              <div
                key={insight.id}
                className="p-4 bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 rounded-lg"
              >
                <p className="text-slate-900 dark:text-slate-100">{insight.insight}</p>
                {insight.confidence && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
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
          <div key={qa.questionId} className="card bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-lg hover:shadow-xl transition-shadow">
            <div className="mb-6">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex-1">{qa.questionText}</h3>
                <span className="ml-4 px-3 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-full">
                  {qa.totalResponses} responses
                </span>
              </div>
            </div>

            {qa.distribution && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Modern Bar Chart */}
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Response Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={qa.distribution}>
                      <defs>
                        <linearGradient id={`colorBar${qaIndex}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                      <XAxis
                        dataKey="optionText"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fill: 'currentColor', fontSize: 12 }}
                        className="text-slate-600 dark:text-slate-400"
                      />
                      <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} className="text-slate-600 dark:text-slate-400" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9'
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
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Percentage Breakdown</h4>
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
                            stroke="currentColor"
                            strokeWidth={2}
                            className="text-white dark:text-slate-800"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(_value, entry: any) => (
                          <span className="text-sm text-slate-700 dark:text-slate-300">{entry.payload.optionText}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {qa.average !== undefined && (
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Average</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{qa.average.toFixed(2)}</p>
                  </div>
                  {qa.median !== undefined && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Median</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">{qa.median}</p>
                    </div>
                  )}
                  {qa.min !== undefined && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Min</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">{qa.min}</p>
                    </div>
                  )}
                  {qa.max !== undefined && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Max</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">{qa.max}</p>
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
