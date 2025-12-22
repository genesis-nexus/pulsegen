import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  Edit3,
  Save,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Zap,
  Send,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { AIProviderCheck, AILoadingState, AIErrorState } from '../../components/ai';

type Mode = 'selection' | 'quick' | 'guided';

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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SurveyDraft {
  title: string;
  description?: string;
  sections?: Array<{
    title: string;
    questions: Array<{
      type: string;
      text: string;
      required?: boolean;
      options?: string[];
    }>;
  }>;
}

export default function CreateWithAI() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('selection');

  // Quick mode state
  const [prompt, setPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [includeLogic, setIncludeLogic] = useState(false);
  const [generatedSurvey, setGeneratedSurvey] = useState<GeneratedSurvey | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  // Guided mode state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [surveyDraft, setSurveyDraft] = useState<SurveyDraft | null>(null);

  // Quick mode: Generate survey
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

  // Quick mode: Save survey
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generatedSurvey) throw new Error('No survey to save');

      const surveyResponse = await api.post('/surveys', {
        title: generatedSurvey.title,
        description: generatedSurvey.description,
      });

      const surveyId = surveyResponse.data.data.id;

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

  // Guided mode: Start conversation
  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/wizard/start');
      return response.data;
    },
    onSuccess: (data) => {
      setMessages([{ role: 'assistant', content: data.initialMessage }]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to start wizard');
    },
  });

  // Guided mode: Send message
  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await api.post('/wizard/message', { message });
      return response.data;
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response },
      ]);
      if (data.surveyDraft) {
        setSurveyDraft(data.surveyDraft);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });

  // Guided mode: Finalize survey
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/wizard/finalize');
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Survey created successfully!');
      navigate(`/surveys/${data.surveyId}/edit`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create survey');
    },
  });

  const handleQuickGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Please describe your survey');
      return;
    }
    generateMutation.mutate();
  };

  const handleGuidedStart = () => {
    setMode('guided');
    startMutation.mutate();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: inputMessage }]);
    sendMutation.mutate(inputMessage);
    setInputMessage('');
  };

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

  // Mode Selection Screen
  if (mode === 'selection') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <div className="inline-flex w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Create Survey with AI</h1>
          <p className="text-lg text-gray-600">
            Choose how you'd like to create your survey
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Generation */}
          <button
            onClick={() => setMode('quick')}
            className="card hover:shadow-xl transition-all p-8 text-left group cursor-pointer border-2 border-transparent hover:border-primary-500"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Quick Generate</h2>
            <p className="text-gray-600 mb-4">
              Describe your survey idea and get a complete survey instantly. Perfect when you
              know exactly what you need.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                One-click generation from description
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                Customize question count and logic
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                Preview and edit before saving
              </li>
            </ul>
            <div className="mt-6 text-primary-600 font-medium group-hover:text-primary-700 flex items-center">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Guided Wizard */}
          <button
            onClick={handleGuidedStart}
            disabled={startMutation.isPending}
            className="card hover:shadow-xl transition-all p-8 text-left group cursor-pointer border-2 border-transparent hover:border-primary-500 disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Guided Wizard</h2>
            <p className="text-gray-600 mb-4">
              Have a conversation with AI to build your survey step by step. Great for
              exploring ideas and iterating.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                Interactive conversation interface
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                Iterative refinement with feedback
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                AI helps define survey structure
              </li>
            </ul>
            <div className="mt-6 text-primary-600 font-medium group-hover:text-primary-700 flex items-center">
              {startMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  Start Wizard
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Quick Generation Mode
  if (mode === 'quick') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => {
                setMode('selection');
                setGeneratedSurvey(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Quick Generate</h1>
          </div>
          <p className="text-gray-600">
            Describe your survey idea and let AI create a complete survey for you.
          </p>
        </div>

        <AIProviderCheck>
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
                    Be specific about the topic, target audience, and what insights you want to
                    gather.
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
                        onChange={(e) =>
                          setQuestionCount(Math.max(5, Math.min(30, parseInt(e.target.value) || 10)))
                        }
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
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    Tips for better results:
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Specify your target audience (customers, employees, students, etc.)</li>
                    <li>• Mention specific topics you want to cover</li>
                    <li>• Include the purpose of the survey (feedback, research, evaluation)</li>
                  </ul>
                </div>

                <button
                  onClick={handleQuickGenerate}
                  disabled={!prompt.trim()}
                  className="w-full btn btn-primary inline-flex items-center justify-center py-3"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Survey
                </button>
              </div>
            </div>
          )}

          {generateMutation.isPending && (
            <div className="card">
              <AILoadingState
                message="Creating your survey..."
                subMessage="AI is designing questions based on your description"
              />
            </div>
          )}

          {generateMutation.isError && !generatedSurvey && (
            <div className="card">
              <AIErrorState
                message="Failed to generate survey. Please try again."
                onRetry={() => generateMutation.mutate()}
              />
            </div>
          )}

          {generatedSurvey && (
            <div className="space-y-6">
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

              <div className="card">
                <div className="flex items-start justify-between mb-4">
                  {editingTitle ? (
                    <div className="flex-1 mr-4">
                      <input
                        type="text"
                        className="input text-xl font-bold"
                        value={generatedSurvey.title}
                        onChange={(e) =>
                          setGeneratedSurvey({ ...generatedSurvey, title: e.target.value })
                        }
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
                  onChange={(e) =>
                    setGeneratedSurvey({ ...generatedSurvey, description: e.target.value })
                  }
                  placeholder="Survey description"
                />
              </div>

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
                                          value: e.target.value
                                            .toLowerCase()
                                            .replace(/\s+/g, '_'),
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
                                onChange={(e) =>
                                  updateQuestion(index, { isRequired: e.target.checked })
                                }
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

  // Guided Wizard Mode
  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setMode('selection');
                setMessages([]);
                setSurveyDraft(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <h1 className="text-xl font-bold">AI Survey Wizard</h1>
          </div>
          {surveyDraft && (
            <button
              onClick={() => finalizeMutation.mutate()}
              disabled={finalizeMutation.isPending}
              className="btn btn-primary btn-sm inline-flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {finalizeMutation.isPending ? 'Creating...' : 'Create Survey'}
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 && !startMutation.isPending ? (
            /* Welcome View */
            <div className="h-full flex items-center justify-center">
              <div className="max-w-2xl text-center space-y-6 px-4">
                <div className="inline-flex w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl items-center justify-center shadow-lg">
                  <MessageSquare className="w-10 h-10 text-white" />
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Welcome to AI Survey Wizard
                  </h2>
                  <p className="text-lg text-gray-600">
                    I'm your AI assistant, ready to help you build the perfect survey through conversation.
                  </p>
                </div>

                <div className="bg-white rounded-xl border shadow-sm p-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
                    How it works
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Tell me about your survey</h4>
                        <p className="text-sm text-gray-600">Share what you want to learn and who you're surveying</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Review and refine</h4>
                        <p className="text-sm text-gray-600">I'll create a draft and we'll iterate together</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Create your survey</h4>
                        <p className="text-sm text-gray-600">When you're happy, I'll create it and you can edit further</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Example prompts to get started:</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p className="italic">"Create a customer satisfaction survey for my online store"</p>
                    <p className="italic">"I need an employee engagement survey with 15 questions"</p>
                    <p className="italic">"Build a product feedback survey for our mobile app"</p>
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  Type your message below to begin...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl rounded-lg px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {sendMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-white border shadow-sm rounded-lg px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white border-t px-6 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="input flex-1"
              disabled={sendMutation.isPending}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sendMutation.isPending}
              className="btn btn-primary inline-flex items-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Preview Panel */}
      {surveyDraft && (
        <div className="w-96 bg-white border-l overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
            <h2 className="font-semibold text-lg">Survey Preview</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <h3 className="font-bold text-xl mb-1">{surveyDraft.title}</h3>
              {surveyDraft.description && (
                <p className="text-sm text-gray-600">{surveyDraft.description}</p>
              )}
            </div>

            {surveyDraft.sections?.map((section, sIdx) => (
              <div key={sIdx} className="border-t pt-4">
                <h4 className="font-semibold mb-3">{section.title}</h4>
                <div className="space-y-3">
                  {section.questions.map((q, qIdx) => (
                    <div key={qIdx} className="text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 text-xs mt-0.5">Q{qIdx + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium">{q.text}</p>
                          <span className="text-xs text-gray-500">{q.type}</span>
                          {q.options && q.options.length > 0 && (
                            <ul className="mt-1 space-y-1">
                              {q.options.map((opt, optIdx) => (
                                <li key={optIdx} className="text-xs text-gray-600">
                                  • {opt}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
