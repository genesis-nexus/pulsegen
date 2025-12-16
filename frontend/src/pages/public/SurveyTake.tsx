import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Survey, QuestionType } from '../../types';
import { SurveyProgressWrapper } from '../../components/survey/SurveyProgressWrapper';

// localStorage utilities
const STORAGE_KEY_PREFIX = 'survey_response_';

const saveResponseToStorage = (slug: string, answers: Record<string, any>) => {
  try {
    const data = {
      answers,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const loadResponseFromStorage = (slug: string) => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${slug}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return null;
};

const clearResponseFromStorage = (slug: string) => {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${slug}`);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};

export default function SurveyTake() {
  const { slug } = useParams();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: survey, isLoading, error } = useQuery({
    queryKey: ['public-survey', slug],
    queryFn: async () => {
      const response = await api.get(`/surveys/${slug}`);
      return response.data.data as Survey;
    },
    retry: false, // Don't retry on error
  });

  // Load saved responses on mount
  useEffect(() => {
    if (!slug) return;

    const savedData = loadResponseFromStorage(slug);
    if (savedData && savedData.answers) {
      setAnswers(savedData.answers);
      setLastSaved(new Date(savedData.timestamp));
      toast.success('We restored your previous answers', {
        icon: '💾',
        duration: 4000,
      });
    }
  }, [slug]);

  // Debounced auto-save function
  const debouncedSave = useCallback((answersToSave: Record<string, any>) => {
    if (!slug) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      saveResponseToStorage(slug, answersToSave);
      setLastSaved(new Date());
      setIsSaving(false);
    }, 500); // 500ms debounce
  }, [slug]);

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post(`/responses/surveys/${survey?.id}/submit`, data);
    },
    onSuccess: () => {
      // Clear localStorage on successful submission
      if (slug) {
        clearResponseFromStorage(slug);
      }
      setSubmitted(true);
      toast.success('Thank you for your response!');
    },
    onError: () => {
      toast.error('Failed to submit response');
    },
  });

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev, [questionId]: value };
      // Auto-save to localStorage
      debouncedSave(newAnswers);
      return newAnswers;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required questions
    const requiredQuestions = survey?.questions.filter((q) => q.isRequired) || [];
    const missingRequired = requiredQuestions.find((q) => !answers[q.id]);

    if (missingRequired) {
      toast.error('Please answer all required questions');
      return;
    }

    // Format answers for API
    const formattedAnswers = Object.entries(answers).map(([questionId, value]) => {
      const question = survey?.questions.find((q) => q.id === questionId);
      const answer: any = { questionId };

      if (typeof value === 'string') {
        if (question?.type === QuestionType.MULTIPLE_CHOICE) {
          answer.optionId = value;
        } else {
          answer.textValue = value;
        }
      } else if (typeof value === 'number') {
        answer.numberValue = value;
      } else if (Array.isArray(value)) {
        // For checkboxes, create multiple answers
        return value.map((v) => ({ questionId, optionId: v }));
      }

      return answer;
    }).flat();

    submitMutation.mutate({ answers: formattedAnswers });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.message || (error as Error).message || 'Unknown error';
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey not found</h1>
          <p className="text-gray-600 mb-4">This survey may have been removed or is no longer available.</p>
          <p className="text-sm text-gray-500 bg-gray-100 p-3 rounded">
            Error: {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey not found</h1>
          <p className="text-gray-600">This survey may have been removed or is no longer available.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600">
            {survey.thankYouText || 'Your response has been submitted successfully.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <SurveyProgressWrapper
      survey={survey}
      currentPage={1}
      totalPages={1}
      currentQuestion={Object.keys(answers).length}
      totalQuestions={survey.questions.length}
    >
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="card mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.title}</h1>
            {survey.description && (
              <p className="text-gray-600">{survey.description}</p>
            )}
            {survey.welcomeText && (
              <p className="mt-4 text-gray-700">{survey.welcomeText}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {survey.questions.map((question, index) => (
              <div key={question.id} className="card">
                <label className="block mb-4">
                  <span className="text-lg font-medium text-gray-900">
                    {index + 1}. {question.text}
                    {question.isRequired && <span className="text-red-600 ml-1">*</span>}
                  </span>
                  {question.description && (
                    <span className="block text-sm text-gray-600 mt-1">
                      {question.description}
                    </span>
                  )}
                </label>

                {question.type === QuestionType.MULTIPLE_CHOICE && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <label key={option.id} className="flex items-center">
                        <input
                          type="radio"
                          name={question.id}
                          value={option.id}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="mr-2"
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === QuestionType.CHECKBOXES && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <label key={option.id} className="flex items-center">
                        <input
                          type="checkbox"
                          value={option.id}
                          onChange={(e) => {
                            const current = answers[question.id] || [];
                            if (e.target.checked) {
                              handleAnswerChange(question.id, [...current, option.id]);
                            } else {
                              handleAnswerChange(
                                question.id,
                                current.filter((id: string) => id !== option.id)
                              );
                            }
                          }}
                          className="mr-2"
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === QuestionType.SHORT_TEXT && (
                  <input
                    type="text"
                    className="input"
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.isRequired}
                  />
                )}

                {question.type === QuestionType.LONG_TEXT && (
                  <textarea
                    className="input"
                    rows={4}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.isRequired}
                  />
                )}

                {question.type === QuestionType.EMAIL && (
                  <input
                    type="email"
                    className="input"
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.isRequired}
                  />
                )}

                {question.type === QuestionType.NUMBER && (
                  <input
                    type="number"
                    className="input"
                    onChange={(e) => handleAnswerChange(question.id, parseFloat(e.target.value))}
                    required={question.isRequired}
                  />
                )}

                {question.type === QuestionType.DATE && (
                  <input
                    type="date"
                    className="input"
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.isRequired}
                  />
                )}

                {question.type === QuestionType.RATING_SCALE && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleAnswerChange(question.id, rating)}
                        className={`w-12 h-12 rounded-lg border-2 font-medium transition-colors ${answers[question.id] === rating
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-gray-300 hover:border-primary-600'
                          }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                )}

                {question.type === QuestionType.YES_NO && (
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(question.id, 'yes')}
                      className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${answers[question.id] === 'yes'
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-gray-300 hover:border-primary-600'
                        }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnswerChange(question.id, 'no')}
                      className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${answers[question.id] === 'no'
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-gray-300 hover:border-primary-600'
                        }`}
                    >
                      No
                    </button>
                  </div>
                )}
                {question.type === QuestionType.DROPDOWN && (
                  <select
                    className="input"
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.isRequired}
                    value={answers[question.id] || ''}
                  >
                    <option value="">Select an option...</option>
                    {question.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.text}
                      </option>
                    ))}
                  </select>
                )}

                {question.type === QuestionType.TIME && (
                  <input
                    type="time"
                    className="input"
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.isRequired}
                  />
                )}

                {question.type === QuestionType.FILE_UPLOAD && (
                  <input
                    type="file"
                    className="input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleAnswerChange(question.id, file.name);
                      }
                    }}
                    required={question.isRequired}
                  />
                )}

                {question.type === QuestionType.SLIDER && (
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={answers[question.id] || 50}
                      onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-center text-sm text-gray-600">
                      Value: {answers[question.id] || 50}
                    </div>
                  </div>
                )}

                {question.type === QuestionType.NPS && (
                  <div className="space-y-2">
                    <div className="flex gap-1 justify-between">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleAnswerChange(question.id, score)}
                          className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${answers[question.id] === score
                            ? score <= 6
                              ? 'border-red-600 bg-red-600 text-white'
                              : score <= 8
                                ? 'border-yellow-600 bg-yellow-600 text-white'
                                : 'border-green-600 bg-green-600 text-white'
                            : 'border-gray-300 hover:border-primary-600'
                            }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Not likely</span>
                      <span>Extremely likely</span>
                    </div>
                  </div>
                )}

                {question.type === QuestionType.LIKERT_SCALE && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <label key={option.id} className="flex items-center">
                        <input
                          type="radio"
                          name={question.id}
                          value={option.id}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="mr-2"
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === QuestionType.RANKING && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-2">Drag to reorder or select in order of preference</p>
                    {question.options.map((option, idx) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium w-6">{idx + 1}.</span>
                        <div className="flex-1 p-3 border-2 border-gray-300 rounded-lg bg-white cursor-move hover:border-primary-600">
                          {option.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {question.type === QuestionType.MATRIX && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 p-2 bg-gray-50"></th>
                          {question.options.slice(0, 5).map((option) => (
                            <th key={option.id} className="border border-gray-300 p-2 bg-gray-50 text-sm">
                              {option.text}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {question.options.slice(0, 5).map((rowOption) => (
                          <tr key={rowOption.id}>
                            <td className="border border-gray-300 p-2 font-medium text-sm">
                              {rowOption.text}
                            </td>
                            {question.options.slice(0, 5).map((colOption) => (
                              <td key={colOption.id} className="border border-gray-300 p-2 text-center">
                                <input
                                  type="radio"
                                  name={`${question.id}_${rowOption.id}`}
                                  onChange={() => handleAnswerChange(`${question.id}_${rowOption.id}`, colOption.id)}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
            <div className="card">
              {/* Auto-save indicator */}
              {lastSaved && (
                <div className="mb-4 flex items-center justify-center text-sm text-gray-600">
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600 mr-2"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>
                        Auto-saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full btn btn-primary"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Response'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SurveyProgressWrapper>
  );
}
