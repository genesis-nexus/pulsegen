import { useState } from 'react';
import { useMutation } from '@tantml:parameter>
import { X, Sparkles, Check, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import AILoadingState from './AILoadingState';
import AIErrorState from './AIErrorState';

interface QuestionOptimizerProps {
  question: {
    id: string;
    text: string;
    type: string;
    options?: { text: string; value: string }[];
  };
  onClose: () => void;
  onApply: (improvements: any) => void;
}

export default function QuestionOptimizer({ question, onClose, onApply }: QuestionOptimizerProps) {
  const [result, setResult] = useState<any>(null);

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/ai/questions/${question.id}/optimize`, {
        text: question.text,
        type: question.type,
        options: question.options,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to optimize question');
    },
  });

  const handleApply = () => {
    if (result) {
      onApply({
        text: result.improvedText,
        options: result.improvedOptions,
      });
      toast.success('Improvements applied');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold">Improve Question with AI</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Original Question */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Original Question</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium">{question.text}</p>
              {question.options && question.options.length > 0 && (
                <div className="mt-2 space-y-1">
                  {question.options.map((opt, i) => (
                    <p key={i} className="text-sm text-gray-600">• {opt.text}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {optimizeMutation.isPending && (
            <AILoadingState
              message="Analyzing your question..."
              subMessage="Finding ways to improve clarity and reduce bias"
            />
          )}

          {/* Error State */}
          {optimizeMutation.isError && (
            <AIErrorState
              message="Unable to optimize the question. Please try again."
              onRetry={() => optimizeMutation.mutate()}
            />
          )}

          {/* Results */}
          {result && !optimizeMutation.isPending && (
            <div className="space-y-6">
              {/* Improved Question */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Improved Question</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-medium text-green-800">{result.improvedText}</p>
                  {result.improvedOptions && result.improvedOptions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {result.improvedOptions.map((opt: any, i: number) => (
                        <p key={i} className="text-sm text-green-700">• {opt.text}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Suggestions */}
              {result.suggestions && result.suggestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Improvement Suggestions</h3>
                  <ul className="space-y-2">
                    {result.suggestions.map((suggestion: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Before/After Comparison */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Before</p>
                    <p className="text-sm text-gray-600 line-through">{question.text}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">After</p>
                    <p className="text-sm text-gray-900 font-medium">{result.improvedText}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Initial State - Generate Button */}
          {!result && !optimizeMutation.isPending && !optimizeMutation.isError && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Let AI analyze your question and suggest improvements for clarity,
                reduced bias, and better response quality.
              </p>
              <button
                onClick={() => optimizeMutation.mutate()}
                className="btn btn-primary inline-flex items-center"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze & Improve
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {result && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
            <button onClick={onClose} className="btn btn-secondary">
              Keep Original
            </button>
            <button onClick={handleApply} className="btn btn-primary">
              Apply Improvements
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
