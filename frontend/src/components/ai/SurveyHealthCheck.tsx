import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Sparkles, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import AILoadingState from './AILoadingState';
import AIErrorState from './AIErrorState';

interface SurveyHealthCheckProps {
  survey: {
    id: string;
    title: string;
    description?: string;
    questions: any[];
  };
  onClose: () => void;
  onApplyImprovement?: (improvement: any) => void;
}

export default function SurveyHealthCheck({ survey, onClose, onApplyImprovement: _onApplyImprovement }: SurveyHealthCheckProps) {
  const [result, setResult] = useState<any>(null);

  const healthCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/ai/surveys/${survey.id}/health-check`, {
        title: survey.title,
        description: survey.description,
        questions: survey.questions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options,
          isRequired: q.isRequired,
        })),
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold">Survey Health Check</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Loading State */}
          {healthCheckMutation.isPending && (
            <AILoadingState
              message="Analyzing your survey..."
              subMessage="Checking question quality, flow, and identifying improvements"
            />
          )}

          {/* Error State */}
          {healthCheckMutation.isError && (
            <AIErrorState
              message="Unable to analyze survey. Please try again."
              onRetry={() => healthCheckMutation.mutate()}
            />
          )}

          {/* Initial State */}
          {!result && !healthCheckMutation.isPending && !healthCheckMutation.isError && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Analyze Your Survey</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                AI will analyze your survey for question quality, logical flow, potential bias,
                and provide actionable improvement suggestions.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <p className="text-sm text-gray-600">
                  <strong>{survey.title}</strong>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {survey.questions.length} questions will be analyzed
                </p>
              </div>
              <button
                onClick={() => healthCheckMutation.mutate()}
                className="btn btn-primary inline-flex items-center"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Run Health Check
              </button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Score Card */}
              <div className={`rounded-xl p-6 ${getScoreBg(result.overallAssessment?.score || 0)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overall Score</p>
                    <p className={`text-4xl font-bold ${getScoreColor(result.overallAssessment?.score || 0)}`}>
                      {result.overallAssessment?.score || 0}/10
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Strengths</p>
                        <p className="text-lg font-semibold text-green-600">
                          {result.overallAssessment?.strengths?.length || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Issues</p>
                        <p className="text-lg font-semibold text-red-600">
                          {result.overallAssessment?.weaknesses?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths */}
              {result.overallAssessment?.strengths?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Strengths</h3>
                  <div className="space-y-2">
                    {result.overallAssessment.strengths.map((strength: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weaknesses */}
              {result.overallAssessment?.weaknesses?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Areas for Improvement</h3>
                  <div className="space-y-2">
                    {result.overallAssessment.weaknesses.map((weakness: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{weakness}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specific Improvements */}
              {result.improvements?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Recommended Improvements</h3>
                  <div className="space-y-3">
                    {result.improvements.map((improvement: any, i: number) => (
                      <div
                        key={i}
                        className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {getPriorityIcon(improvement.priority)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded capitalize">
                                {improvement.type}
                              </span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                                improvement.priority === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : improvement.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {improvement.priority} priority
                              </span>
                            </div>
                            <p className="text-sm font-medium mb-1">{improvement.issue}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="text-gray-400">Suggestion:</span>
                              <span>{improvement.suggestion}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {result.improvedSurvey?.suggestedChanges && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Summary</h3>
                  <p className="text-sm text-blue-700">{result.improvedSurvey.suggestedChanges}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-4 border-t bg-gray-50">
          {result ? (
            <>
              <button
                onClick={() => healthCheckMutation.mutate()}
                className="btn btn-secondary"
              >
                Re-analyze
              </button>
              <button onClick={onClose} className="btn btn-primary">
                Done
              </button>
            </>
          ) : (
            <button onClick={onClose} className="btn btn-secondary ml-auto">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
