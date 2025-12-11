import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Survey, QuestionType } from '../../types';
import { SurveyProgressWrapper } from '../../components/survey/SurveyProgressWrapper';

export default function SurveyTake() {
  const { slug } = useParams();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: survey, isLoading } = useQuery({
    queryKey: ['public-survey', slug],
    queryFn: async () => {
      const response = await api.get(`/surveys/${slug}`);
      return response.data.data as Survey;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post(`/responses/surveys/${survey?.id}/submit`, data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Thank you for your response!');
    },
    onError: () => {
      toast.error('Failed to submit response');
    },
  });

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
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
              </div>
            ))}

            <div className="card">
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
