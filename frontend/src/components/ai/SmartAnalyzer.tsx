import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, TrendingUp, MessageSquare, Target, Lightbulb, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import AILoadingState from './AILoadingState';
import AIErrorState from './AIErrorState';
import AIProviderCheck from './AIProviderCheck';

interface SmartAnalyzerProps {
  surveyId: string;
  surveyTitle: string;
  analytics: any;
  responses: any[];
  questions: any[];
}

interface AnalysisResult {
  executiveSummary: string;
  keyMetrics: Array<{
    name: string;
    value: string;
    trend: string;
    insight: string;
  }>;
  highlights: string[];
  actionItems: string[];
  sentiment: string;
  themes?: Array<{
    theme: string;
    count: number;
    examples: string[];
  }>;
  recommendations?: Array<{
    recommendation: string;
    priority: string;
    rationale: string;
  }>;
}

export default function SmartAnalyzer({
  surveyId,
  surveyTitle: _surveyTitle,
  analytics,
  responses,
  questions,
}: SmartAnalyzerProps) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisType, setAnalysisType] = useState<'summary' | 'sentiment' | 'themes' | 'recommendations'>('summary');

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/ai/surveys/${surveyId}/analyze`, {
        analysisType,
        responses: responses.slice(0, 100), // Limit for API
        questions,
        analytics,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to analyze survey');
    },
  });

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    return <span className="w-4 h-4 text-gray-400">—</span>;
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'positive') return 'bg-green-100 text-green-800';
    if (sentiment === 'negative') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <AIProviderCheck>
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI-Powered Analysis</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Deep insights from your survey data</p>
            </div>
          </div>
          {result && (
            <button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="btn btn-secondary inline-flex items-center text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>

        {/* Analysis Type Selector */}
        {!result && !analyzeMutation.isPending && (
          <div className="mb-6">
            <label className="label mb-2">Analysis Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'summary', label: 'Executive Summary', icon: Sparkles },
                { value: 'sentiment', label: 'Sentiment Analysis', icon: MessageSquare },
                { value: 'themes', label: 'Theme Extraction', icon: Target },
                { value: 'recommendations', label: 'Recommendations', icon: Lightbulb },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setAnalysisType(type.value as any)}
                  className={`p-3 rounded-lg border-2 transition-colors text-left ${
                    analysisType === type.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <type.icon className={`w-5 h-5 mb-1 ${
                    analysisType === type.value ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    analysisType === type.value ? 'text-primary-900 dark:text-primary-200' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        {!result && !analyzeMutation.isPending && !analyzeMutation.isError && (
          <button
            onClick={() => analyzeMutation.mutate()}
            className="w-full btn btn-primary inline-flex items-center justify-center py-3"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate AI Analysis
          </button>
        )}

        {/* Loading State */}
        {analyzeMutation.isPending && (
          <AILoadingState
            message="Analyzing your survey data..."
            subMessage="This may take a moment for thorough analysis"
          />
        )}

        {/* Error State */}
        {analyzeMutation.isError && !result && (
          <AIErrorState
            message="Unable to analyze survey. Please try again."
            onRetry={() => analyzeMutation.mutate()}
          />
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Executive Summary */}
            {result.executiveSummary && (
              <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-950/30 dark:to-purple-950/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-primary-800 dark:text-primary-300 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Executive Summary
                </h3>
                <p className="text-slate-700 dark:text-slate-300">{result.executiveSummary}</p>
                {result.sentiment && (
                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${getSentimentColor(result.sentiment)}`}>
                    Overall Sentiment: {result.sentiment}
                  </span>
                )}
              </div>
            )}

            {/* Key Metrics */}
            {result.keyMetrics && result.keyMetrics.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Key Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {result.keyMetrics.map((metric, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{metric.name}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{metric.value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{metric.insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Highlights */}
            {result.highlights && result.highlights.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Key Findings</h3>
                <ul className="space-y-2">
                  {result.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                        {i + 1}
                      </span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Themes */}
            {result.themes && result.themes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Identified Themes</h3>
                <div className="space-y-3">
                  {result.themes.map((theme, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900 dark:text-white">{theme.theme}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{theme.count} mentions</span>
                      </div>
                      {theme.examples && theme.examples.length > 0 && (
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          <span className="text-xs text-slate-400">Examples: </span>
                          {theme.examples.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items / Recommendations */}
            {result.actionItems && result.actionItems.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Recommended Actions</h3>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <ul className="space-y-2">
                    {result.actionItems.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                        <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Detailed Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Detailed Recommendations</h3>
                <div className="space-y-3">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{rec.recommendation}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{rec.rationale}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                          rec.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : rec.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AIProviderCheck>
  );
}
