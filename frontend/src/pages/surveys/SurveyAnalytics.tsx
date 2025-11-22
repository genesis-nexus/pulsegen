import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import { Survey, Analytics, QuestionAnalytics } from '../../types';
import { SmartAnalyzer } from '../../components/ai';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function SurveyAnalytics() {
  const { id } = useParams();

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">{survey?.title}</h1>
            <p className="text-gray-600">Survey Analytics</p>
          </div>
          <button className="btn btn-primary inline-flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-600">Total Responses</p>
          <p className="text-3xl font-bold text-gray-900">
            {analytics?.totalResponses || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Completion Rate</p>
          <p className="text-3xl font-bold text-green-600">
            {analytics?.completionRate?.toFixed(1) || 0}%
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Avg. Duration</p>
          <p className="text-3xl font-bold text-blue-600">
            {analytics?.averageDuration ? `${Math.round(analytics.averageDuration / 60)}m` : 'N/A'}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Drop-off Rate</p>
          <p className="text-3xl font-bold text-red-600">
            {analytics?.dropoffRate?.toFixed(1) || 0}%
          </p>
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
        {questionAnalytics?.map((qa) => (
          <div key={qa.questionId} className="card">
            <h3 className="text-lg font-semibold mb-4">{qa.questionText}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {qa.totalResponses} responses
            </p>

            {qa.distribution && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={qa.distribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="optionText"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={qa.distribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.percentage.toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {qa.distribution.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
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
