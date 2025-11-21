import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tantml:parameter>
import { Sparkles, ArrowRight, Plus, Minus, Edit3, Save, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { AIProviderCheck, AILoadingState, AIErrorState } from '../../components/ai';

interface GeneratedQuestion {
  type: string;
  text: string;
  isRequired: boolean;
  options?: { text: string; value: string }[];
}

interface GeneratedSurvey {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
}

export default function AIBuilder() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [includeLogic, setIncludeLogic] = useState(false);
  const [generatedSurvey, setGeneratedSurvey] = useState<GeneratedSurvey | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/ai/generate-survey', {
        prompt,
        questionCount,
        includeLogic,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setGeneratedSurvey(data);
      toast.success('Survey generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate survey');
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generatedSurvey) throw new Error('No survey to save');

      // Create the survey
      const surveyResponse = await api.post('/surveys', {
        title: generatedSurvey.title,
        description: generatedSurvey.description,
      });

      const surveyId = surveyResponse.data.data.id;

      // Add questions
      for (const question of generatedSurvey.questions) {
        await api.post(`/surveys/${surveyId}/questions`, {
          type: question.type,
          text: question.text,
          isRequired: question.isRequired,
          options: question.options,
        });
      }

      return surveyId;
    },
    onSuccess: (surveyId) => {
      toast.success('Survey saved successfully!');
      navigate(`/surveys/${surveyId}/edit`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save survey');
    },
  });

  const toggleQuestionExpanded = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const updateQuestion = (index: number, updates: Partial<GeneratedQuestion>) => {
    if (!generatedSurvey) return;
    const newQuestions = [...generatedSurvey.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setGeneratedSurvey({ ...generatedSurvey, questions: newQuestions });
  };

  const removeQuestion = (index: number) => {
    if (!generatedSurvey) return;
    const newQuestions = generatedSurvey.questions.filter((_, i) => i !== index);
    setGeneratedSurvey({ ...generatedSurvey, questions: newQuestions });
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Please describe your survey');
      return;
    }
    generateMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Create Survey with AI</h1>
        </div>
        <p className="text-gray-600">
          Describe your survey idea and let AI create a complete survey for you.
        </p>
      </div>

      <AIProviderCheck>
        {/* Generation Form */}
        {!generatedSurvey && !generateMutation.isPending && (
          <div className="card">
            <div className="space-y-6">
              <div>
                <label className="label">Describe your survey</label>
                <textarea
                  className="input"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., A customer satisfaction survey for an e-commerce website that asks about shopping experience, product quality, delivery service, and likelihood to recommend..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be specific about the topic, target audience, and what insights you want to gather.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Number of questions</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuestionCount(Math.max(5, questionCount - 1))}
                      className="btn btn-secondary p-2"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      className="input text-center w-20"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Math.max(5, Math.min(30, parseInt(e.target.value) || 10)))}
                      min={5}
                      max={30}
                    />
                    <button
                      onClick={() => setQuestionCount(Math.min(30, questionCount + 1))}
                      className="btn btn-secondary p-2"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Include skip logic</label>
                  <label className="inline-flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={includeLogic}
                      onChange={(e) => setIncludeLogic(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Add conditional question logic</span>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Tips for better results:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Specify your target audience (customers, employees, students, etc.)</li>
                  <li>• Mention specific topics you want to cover</li>
                  <li>• Include the purpose of the survey (feedback, research, evaluation)</li>
                </ul>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="w-full btn btn-primary inline-flex items-center justify-center py-3"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Survey
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {generateMutation.isPending && (
          <div className="card">
            <AILoadingState
              message="Creating your survey..."
              subMessage="AI is designing questions based on your description"
            />
          </div>
        )}

        {/* Error State */}
        {generateMutation.isError && !generatedSurvey && (
          <div className="card">
            <AIErrorState
              message="Failed to generate survey. Please try again."
              onRetry={() => generateMutation.mutate()}
            />
          </div>
        )}

        {/* Generated Survey Preview */}
        {generatedSurvey && (
          <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setGeneratedSurvey(null)}
                className="btn btn-secondary"
              >
                Start Over
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="btn btn-primary inline-flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save & Edit Survey'}
              </button>
            </div>

            {/* Survey Info */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                {editingTitle ? (
                  <div className="flex-1 mr-4">
                    <input
                      type="text"
                      className="input text-xl font-bold"
                      value={generatedSurvey.title}
                      onChange={(e) => setGeneratedSurvey({ ...generatedSurvey, title: e.target.value })}
                      autoFocus
                      onBlur={() => setEditingTitle(false)}
                    />
                  </div>
                ) : (
                  <h2 className="text-xl font-bold">{generatedSurvey.title}</h2>
                )}
                <button
                  onClick={() => setEditingTitle(!editingTitle)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                className="input"
                rows={2}
                value={generatedSurvey.description}
                onChange={(e) => setGeneratedSurvey({ ...generatedSurvey, description: e.target.value })}
                placeholder="Survey description"
              />
            </div>

            {/* Questions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Questions ({generatedSurvey.questions.length})
              </h3>
              <div className="space-y-3">
                {generatedSurvey.questions.map((question, index) => {
                  const isExpanded = expandedQuestions.has(index);
                  return (
                    <div key={index} className="card">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleQuestionExpanded(index)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-sm font-medium text-gray-500 w-8">
                            Q{index + 1}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded">
                            {question.type.replace('_', ' ')}
                          </span>
                          <span className="font-medium truncate">{question.text}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeQuestion(index);
                            }}
                            className="text-red-500 hover:text-red-600 p-1"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div>
                            <label className="label">Question Text</label>
                            <input
                              type="text"
                              className="input"
                              value={question.text}
                              onChange={(e) => updateQuestion(index, { text: e.target.value })}
                            />
                          </div>
                          {question.options && question.options.length > 0 && (
                            <div>
                              <label className="label">Options</label>
                              <div className="space-y-2">
                                {question.options.map((option, optIndex) => (
                                  <input
                                    key={optIndex}
                                    type="text"
                                    className="input"
                                    value={option.text}
                                    onChange={(e) => {
                                      const newOptions = [...question.options!];
                                      newOptions[optIndex] = {
                                        ...newOptions[optIndex],
                                        text: e.target.value,
                                        value: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                                      };
                                      updateQuestion(index, { options: newOptions });
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={question.isRequired}
                              onChange={(e) => updateQuestion(index, { isRequired: e.target.checked })}
                              className="mr-2"
                            />
                            <span className="text-sm">Required question</span>
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Save Button */}
            <div className="flex justify-end">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="btn btn-primary inline-flex items-center"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Continue to Editor'}
              </button>
            </div>
          </div>
        )}
      </AIProviderCheck>
    </div>
  );
}
