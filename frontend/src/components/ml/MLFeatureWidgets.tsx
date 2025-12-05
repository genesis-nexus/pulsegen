/**
 * ML Feature Dashboard Widgets
 *
 * Reusable widgets to display ML feature statistics in survey analytics.
 */

import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  MessageSquare,
  Users,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Smile,
  Frown,
  Meh,
  HelpCircle,
} from 'lucide-react';
import api from '../../lib/api';

// ============================================================================
// RESPONSE QUALITY WIDGET
// ============================================================================

interface QualityStats {
  totalAnalyzed: number;
  averageScore: number;
  recommendationDistribution: {
    ACCEPT: number;
    REVIEW: number;
    REJECT: number;
  };
  topFlags: Array<{ flag: string; count: number }>;
}

interface QualityWidgetProps {
  surveyId: string;
  compact?: boolean;
}

export function ResponseQualityWidget({ surveyId, compact = false }: QualityWidgetProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['quality-stats', surveyId],
    queryFn: async () => {
      const response = await api.get(`/ml/features/quality/stats/${surveyId}`);
      return response.data.data as QualityStats;
    },
    enabled: !!surveyId,
  });

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!stats || stats.totalAnalyzed === 0) {
    return (
      <div className="card bg-gray-50">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-gray-400" />
          <div>
            <h3 className="font-semibold text-gray-600">Response Quality</h3>
            <p className="text-sm text-gray-500">No responses analyzed yet</p>
          </div>
        </div>
      </div>
    );
  }

  const total = stats.recommendationDistribution.ACCEPT +
    stats.recommendationDistribution.REVIEW +
    stats.recommendationDistribution.REJECT;
  const acceptRate = total > 0 ? (stats.recommendationDistribution.ACCEPT / total) * 100 : 0;
  const reviewRate = total > 0 ? (stats.recommendationDistribution.REVIEW / total) * 100 : 0;
  const rejectRate = total > 0 ? (stats.recommendationDistribution.REJECT / total) * 100 : 0;

  if (compact) {
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold">Quality Score</h3>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageScore.toFixed(0)}
                <span className="text-sm font-normal text-gray-500">/100</span>
              </p>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-green-600">
              {stats.recommendationDistribution.ACCEPT} accepted
            </div>
            <div className="text-amber-600">
              {stats.recommendationDistribution.REVIEW} review
            </div>
            <div className="text-red-600">
              {stats.recommendationDistribution.REJECT} rejected
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-50 rounded-lg">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="font-semibold">Response Quality</h3>
          <p className="text-sm text-gray-500">
            {stats.totalAnalyzed.toLocaleString()} responses analyzed
          </p>
        </div>
      </div>

      {/* Average Score */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-600">Average Quality Score</span>
          <span className="font-semibold">{stats.averageScore.toFixed(1)}/100</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              stats.averageScore >= 70
                ? 'bg-green-500'
                : stats.averageScore >= 50
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${stats.averageScore}%` }}
          />
        </div>
      </div>

      {/* Distribution */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-green-700">
            {stats.recommendationDistribution.ACCEPT}
          </div>
          <div className="text-xs text-green-600">Accepted ({acceptRate.toFixed(0)}%)</div>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-amber-700">
            {stats.recommendationDistribution.REVIEW}
          </div>
          <div className="text-xs text-amber-600">Review ({reviewRate.toFixed(0)}%)</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-red-700">
            {stats.recommendationDistribution.REJECT}
          </div>
          <div className="text-xs text-red-600">Rejected ({rejectRate.toFixed(0)}%)</div>
        </div>
      </div>

      {/* Top Issues */}
      {stats.topFlags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Common Issues</h4>
          <div className="space-y-1">
            {stats.topFlags.map(({ flag, count }) => (
              <div key={flag} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {flag.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                </span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SENTIMENT ANALYSIS WIDGET
// ============================================================================

interface SentimentStats {
  totalAnalyzed: number;
  averageScore: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  topEmotions: Array<{ emotion: string; count: number }>;
  topKeywords: Array<{ keyword: string; count: number }>;
}

interface SentimentWidgetProps {
  surveyId: string;
  compact?: boolean;
}

export function SentimentAnalysisWidget({ surveyId, compact = false }: SentimentWidgetProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['sentiment-stats', surveyId],
    queryFn: async () => {
      const response = await api.get(`/ml/features/sentiment/stats/${surveyId}`);
      return response.data.data as SentimentStats;
    },
    enabled: !!surveyId,
  });

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!stats || stats.totalAnalyzed === 0) {
    return (
      <div className="card bg-gray-50">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-gray-400" />
          <div>
            <h3 className="font-semibold text-gray-600">Sentiment Analysis</h3>
            <p className="text-sm text-gray-500">No text responses analyzed yet</p>
          </div>
        </div>
      </div>
    );
  }

  const total = stats.sentimentDistribution.positive +
    stats.sentimentDistribution.negative +
    stats.sentimentDistribution.neutral +
    stats.sentimentDistribution.mixed;

  const getSentimentIcon = () => {
    if (stats.averageScore > 0.3) return <Smile className="w-6 h-6 text-green-500" />;
    if (stats.averageScore < -0.3) return <Frown className="w-6 h-6 text-red-500" />;
    return <Meh className="w-6 h-6 text-amber-500" />;
  };

  const getSentimentLabel = () => {
    if (stats.averageScore > 0.3) return 'Positive';
    if (stats.averageScore < -0.3) return 'Negative';
    if (stats.averageScore > 0.1 || stats.averageScore < -0.1) return 'Mixed';
    return 'Neutral';
  };

  if (compact) {
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Sentiment</h3>
              <div className="flex items-center gap-2">
                {getSentimentIcon()}
                <span className="text-lg font-bold">{getSentimentLabel()}</span>
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            {stats.totalAnalyzed} analyzed
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <MessageSquare className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold">Sentiment Analysis</h3>
          <p className="text-sm text-gray-500">
            {stats.totalAnalyzed.toLocaleString()} text responses analyzed
          </p>
        </div>
      </div>

      {/* Overall Sentiment */}
      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg mb-4">
        {getSentimentIcon()}
        <div className="ml-3">
          <div className="text-2xl font-bold">{getSentimentLabel()}</div>
          <div className="text-sm text-gray-500">
            Score: {(stats.averageScore * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Distribution */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Distribution</h4>
        <div className="space-y-2">
          {[
            { key: 'positive', label: 'Positive', color: 'bg-green-500' },
            { key: 'neutral', label: 'Neutral', color: 'bg-gray-400' },
            { key: 'mixed', label: 'Mixed', color: 'bg-amber-500' },
            { key: 'negative', label: 'Negative', color: 'bg-red-500' },
          ].map(({ key, label, color }) => {
            const count = stats.sentimentDistribution[key as keyof typeof stats.sentimentDistribution];
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{label}</span>
                  <span className="text-gray-600">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Keywords */}
      {stats.topKeywords.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Top Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {stats.topKeywords.slice(0, 8).map(({ keyword, count }) => (
              <span
                key={keyword}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {keyword} ({count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DROPOUT PREDICTION WIDGET
// ============================================================================

interface DropoutStats {
  totalPredictions: number;
  averageDropoutProbability: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  interventionsShown: number;
  dropoutsByPage: Array<{ page: number; count: number; avgProbability: number }>;
}

interface DropoutWidgetProps {
  surveyId: string;
  compact?: boolean;
}

export function DropoutPredictionWidget({ surveyId, compact = false }: DropoutWidgetProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dropout-stats', surveyId],
    queryFn: async () => {
      const response = await api.get(`/ml/features/dropout/stats/${surveyId}`);
      return response.data.data as DropoutStats;
    },
    enabled: !!surveyId,
  });

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!stats || stats.totalPredictions === 0) {
    return (
      <div className="card bg-gray-50">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-gray-400" />
          <div>
            <h3 className="font-semibold text-gray-600">Dropout Prediction</h3>
            <p className="text-sm text-gray-500">No predictions made yet</p>
          </div>
        </div>
      </div>
    );
  }

  const total = stats.riskDistribution.low +
    stats.riskDistribution.medium +
    stats.riskDistribution.high +
    stats.riskDistribution.critical;

  if (compact) {
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold">Dropout Risk</h3>
              <p className="text-2xl font-bold">
                {(stats.averageDropoutProbability * 100).toFixed(0)}%
                <span className="text-sm font-normal text-gray-500"> avg risk</span>
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            {stats.interventionsShown} interventions shown
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-50 rounded-lg">
          <TrendingDown className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold">Dropout Prediction</h3>
          <p className="text-sm text-gray-500">
            {stats.totalPredictions.toLocaleString()} predictions made
          </p>
        </div>
      </div>

      {/* Average Risk */}
      <div className="mb-4 p-3 bg-amber-50 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-amber-700">
            {(stats.averageDropoutProbability * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-amber-600">Average Dropout Risk</div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Distribution</h4>
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
            { key: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700' },
            { key: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
            { key: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
          ].map(({ key, label, color }) => {
            const count = stats.riskDistribution[key as keyof typeof stats.riskDistribution];
            return (
              <div key={key} className={`text-center p-2 rounded-lg ${color}`}>
                <div className="text-lg font-bold">{count}</div>
                <div className="text-xs">{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interventions */}
      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-4">
        <span className="text-sm text-gray-600">Interventions shown</span>
        <span className="font-bold text-purple-600">{stats.interventionsShown}</span>
      </div>

      {/* Dropouts by Page */}
      {stats.dropoutsByPage.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Risk by Page</h4>
          <div className="space-y-1">
            {stats.dropoutsByPage.slice(0, 5).map(({ page, count, avgProbability }) => (
              <div key={page} className="flex justify-between text-sm">
                <span className="text-gray-600">Page {page}</span>
                <span className={`font-medium ${
                  avgProbability > 0.7 ? 'text-red-600' :
                  avgProbability > 0.5 ? 'text-amber-600' : 'text-gray-600'
                }`}>
                  {(avgProbability * 100).toFixed(0)}% risk ({count} predictions)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMBINED WIDGET
// ============================================================================

interface MLInsightsPanelProps {
  surveyId: string;
}

export function MLInsightsPanel({ surveyId }: MLInsightsPanelProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-gray-500" />
        ML-Powered Insights
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        <ResponseQualityWidget surveyId={surveyId} compact />
        <SentimentAnalysisWidget surveyId={surveyId} compact />
        <DropoutPredictionWidget surveyId={surveyId} compact />
      </div>
    </div>
  );
}

export default {
  ResponseQualityWidget,
  SentimentAnalysisWidget,
  DropoutPredictionWidget,
  MLInsightsPanel,
};
