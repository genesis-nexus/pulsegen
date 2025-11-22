import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Clock,
  Zap,
  DollarSign,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Cpu,
  MessageSquare,
  Sparkles,
  FileText,
} from 'lucide-react';
import api from '../../lib/api';

interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  averageLatencyMs: number;
  byProvider: Record<string, { requests: number; tokens: number; cost: number }>;
  byFeature: Record<string, { requests: number; tokens: number }>;
  dailyUsage: Array<{ date: string; requests: number; tokens: number; cost: number }>;
}

const FEATURE_LABELS: Record<string, { label: string; icon: typeof Sparkles }> = {
  SURVEY_GENERATE: { label: 'Survey Generation', icon: FileText },
  QUESTION_SUGGEST: { label: 'Question Suggestions', icon: Sparkles },
  QUESTION_OPTIMIZE: { label: 'Question Optimization', icon: Zap },
  RESPONSE_ANALYZE: { label: 'Response Analysis', icon: BarChart3 },
  SENTIMENT_ANALYZE: { label: 'Sentiment Analysis', icon: Activity },
  REPORT_GENERATE: { label: 'Report Generation', icon: FileText },
  SURVEY_IMPROVE: { label: 'Survey Improvement', icon: TrendingUp },
  ANALYTICS_SUMMARY: { label: 'Analytics Summary', icon: BarChart3 },
  CHAT: { label: 'AI Chat', icon: MessageSquare },
  OTHER: { label: 'Other', icon: Cpu },
};

export default function AIUsage() {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['ai-usage', timeRange],
    queryFn: async () => {
      const response = await api.get(`/ai/usage?days=${timeRange}`);
      return response.data.data as UsageStats;
    },
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return '<$0.01';
    return `$${cost.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const successRate = stats
    ? ((stats.successfulRequests / Math.max(stats.totalRequests, 1)) * 100).toFixed(1)
    : '0';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">AI Usage</h1>
            <p className="text-gray-600 mt-1">Track your AI feature usage and token consumption</p>
          </div>
          <div className="flex gap-2">
            {(['7', '30', '90'] as const).map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === days
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-2xl font-bold mt-1">{formatNumber(stats?.totalRequests || 0)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {successRate}% success rate
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tokens Used</p>
              <p className="text-2xl font-bold mt-1">{formatNumber(stats?.totalTokens || 0)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatNumber(stats?.inputTokens || 0)} in / {formatNumber(stats?.outputTokens || 0)} out
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Estimated Cost</p>
              <p className="text-2xl font-bold mt-1">{formatCost(stats?.estimatedCost || 0)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Based on provider pricing
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Latency</p>
              <p className="text-2xl font-bold mt-1">{stats?.averageLatencyMs || 0}ms</p>
              <p className="text-sm text-gray-500 mt-1">
                Response time
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Usage by Feature & Provider */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* By Feature */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Usage by Feature</h3>
          {stats?.byFeature && Object.keys(stats.byFeature).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.byFeature)
                .sort((a, b) => b[1].requests - a[1].requests)
                .map(([feature, data]) => {
                  const config = FEATURE_LABELS[feature] || FEATURE_LABELS.OTHER;
                  const Icon = config.icon;
                  const percentage = (data.requests / stats.totalRequests) * 100;

                  return (
                    <div key={feature}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {data.requests} requests ({formatNumber(data.tokens)} tokens)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No usage data yet</p>
          )}
        </div>

        {/* By Provider */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Usage by Provider</h3>
          {stats?.byProvider && Object.keys(stats.byProvider).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.byProvider)
                .sort((a, b) => b[1].requests - a[1].requests)
                .map(([provider, data]) => {
                  const percentage = (data.requests / stats.totalRequests) * 100;

                  return (
                    <div key={provider}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{provider}</span>
                        <span className="text-sm text-gray-500">
                          {data.requests} requests ({formatCost(data.cost)})
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No usage data yet</p>
          )}
        </div>
      </div>

      {/* Daily Usage Chart (Simple table view) */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Daily Usage</h3>
        {stats?.dailyUsage && stats.dailyUsage.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Date</th>
                  <th className="pb-2 text-right">Requests</th>
                  <th className="pb-2 text-right">Tokens</th>
                  <th className="pb-2 text-right">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {stats.dailyUsage.slice(-14).reverse().map((day) => (
                  <tr key={day.date} className="border-b border-gray-100">
                    <td className="py-2">{new Date(day.date).toLocaleDateString()}</td>
                    <td className="py-2 text-right">{day.requests}</td>
                    <td className="py-2 text-right">{formatNumber(day.tokens)}</td>
                    <td className="py-2 text-right">{formatCost(day.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No daily usage data yet</p>
        )}
      </div>
    </div>
  );
}
