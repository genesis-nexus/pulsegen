import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Sparkles, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import AILoadingState from './AILoadingState';
import AIErrorState from './AIErrorState';

interface SuggestQuestionsProps {
  surveyId: string;
  surveyTitle: string;
  existingQuestions: string[];
  onClose: () => void;
  onAddQuestion: (question: any) => void;
}

export default function SuggestQuestions({
  surveyId,
  surveyTitle,
  existingQuestions,
  onClose,
  onAddQuestion,
}: SuggestQuestionsProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [targetAudience, setTargetAudience] = useState('');

  const suggestMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/ai/surveys/${surveyId}/suggest-questions`, {
        surveyTitle,
        existingQuestions,
        targetAudience: targetAudience || undefined,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to get suggestions');
    },
  });

  const handleAddQuestion = (suggestion: any, index: number) => {
    onAddQuestion({
      type: suggestion.type,
      text: suggestion.text,
      options: suggestion.options,
    });
    setAddedIds(new Set([...addedIds, index]));
    toast.success('Question added to survey');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold">AI Question Suggestions</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Loading State */}
          {suggestMutation.isPending && (
            <AILoadingState
              message="Generating question suggestions..."
              subMessage="Analyzing your survey to find gaps and opportunities"
            />
          )}

          {/* Error State */}
          {suggestMutation.isError && (
            <AIErrorState
              message="Unable to generate suggestions. Please try again."
              onRetry={() => suggestMutation.mutate()}
            />
          )}

          {/* Initial State */}
          {!suggestions.length && !suggestMutation.isPending && !suggestMutation.isError && (
            <div className="space-y-4">
              <p className="text-gray-600">
                AI will analyze your survey "{surveyTitle}" and suggest additional questions
                that could provide valuable insights.
              </p>

              <div>
                <label className="label">Target Audience (Optional)</label>
                <input
                  type="text"
                  className="input"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Software developers, Small business owners"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Providing context helps AI generate more relevant questions
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Current questions:</strong> {existingQuestions.length}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  AI will suggest questions that complement your existing ones
                </p>
              </div>

              <button
                onClick={() => suggestMutation.mutate()}
                className="w-full btn btn-primary inline-flex items-center justify-center"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Suggestions
              </button>
            </div>
          )}

          {/* Suggestions List */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {suggestions.length} question suggestions based on your survey. Click to add them.
              </p>

              {suggestions.map((suggestion, index) => {
                const isAdded = addedIds.has(index);
                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-colors ${
                      isAdded
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded">
                            {suggestion.type?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="font-medium mb-2">{suggestion.text}</p>
                        {suggestion.options && suggestion.options.length > 0 && (
                          <div className="space-y-1">
                            {suggestion.options.map((opt: any, i: number) => (
                              <p key={i} className="text-sm text-gray-600">• {opt.text}</p>
                            ))}
                          </div>
                        )}
                        {suggestion.reasoning && (
                          <p className="text-xs text-gray-500 mt-2 italic">
                            Why: {suggestion.reasoning}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddQuestion(suggestion, index)}
                        disabled={isAdded}
                        className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                          isAdded
                            ? 'bg-green-100 text-green-600'
                            : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                        }`}
                      >
                        {isAdded ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => suggestMutation.mutate()}
                className="w-full btn btn-secondary"
              >
                Generate More Suggestions
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
          <button onClick={onClose} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
