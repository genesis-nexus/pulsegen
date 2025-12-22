import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Send,
  Sparkles,
  Clock,
  Check,
  RefreshCw,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { AIProviderCheck } from '../../components/ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SurveyDraft {
  title: string;
  description: string;
  pages: Array<{
    title: string;
    questions: Array<{
      text: string;
      type: string;
      options?: Array<{ text: string }>;
      isRequired: boolean;
    }>;
  }>;
}

interface EstimatedTime {
  minutes: number;
  label: string;
}

const QUICK_ACTIONS = [
  'Make it shorter',
  'Add demographics',
  'More open-ended questions',
  'Add rating scales',
];

export default function SurveyWizard() {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [surveyDraft, setSurveyDraft] = useState<SurveyDraft | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<EstimatedTime | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  // Check for existing wizard state
  const { data: wizardState } = useQuery({
    queryKey: ['wizard-state'],
    queryFn: async () => {
      const response = await api.get('/wizard/state');
      return response.data;
    },
    retry: false,
  });

  // Start conversation
  const startMutation = useMutation({
    mutationFn: () => api.post('/wizard/start'),
    onSuccess: (res) => {
      setMessages([
        {
          role: 'assistant',
          content: res.data.message,
          timestamp: new Date(),
        },
      ]);
      setIsStarted(true);
      setSurveyDraft(null);
      setEstimatedTime(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to start wizard');
    },
  });

  // Send message
  const sendMutation = useMutation({
    mutationFn: (message: string) => api.post('/wizard/message', { message }),
    onSuccess: (res) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.response,
          timestamp: new Date(),
        },
      ]);
      if (res.data.surveyDraft) {
        setSurveyDraft(res.data.surveyDraft);
        setEstimatedTime(res.data.estimatedTime);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send message');
    },
  });

  // Finalize survey
  const finalizeMutation = useMutation({
    mutationFn: () => api.post('/wizard/finalize'),
    onSuccess: (res) => {
      toast.success('Survey created successfully!');
      navigate(`/surveys/${res.data.surveyId}/edit`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create survey');
    },
  });

  // Cancel wizard
  const cancelMutation = useMutation({
    mutationFn: () => api.delete('/wizard/cancel'),
    onSuccess: () => {
      setMessages([]);
      setSurveyDraft(null);
      setEstimatedTime(null);
      setIsStarted(false);
      toast.success('Wizard reset');
    },
  });

  // Load existing state or start new conversation
  useEffect(() => {
    if (wizardState?.active) {
      setIsStarted(true);
      if (wizardState.surveyDraft) {
        setSurveyDraft(wizardState.surveyDraft);
        setEstimatedTime(wizardState.estimatedTime);
      }
      // We don't have the full message history, just show resume message
      setMessages([
        {
          role: 'assistant',
          content:
            'Welcome back! You have an existing survey draft in progress. Continue our conversation or say "start over" to begin fresh.',
          timestamp: new Date(),
        },
      ]);
    } else if (!isStarted && !startMutation.isPending) {
      startMutation.mutate();
    }
  }, [wizardState]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: input,
        timestamp: new Date(),
      },
    ]);

    sendMutation.mutate(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    inputRef.current?.focus();
  };

  const getTotalQuestionCount = () => {
    if (!surveyDraft) return 0;
    return surveyDraft.pages.reduce((acc, page) => acc + page.questions.length, 0);
  };

  return (
    <AIProviderCheck>
      <div className="h-[calc(100vh-64px)] flex">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">AI Survey Wizard</h1>
                  <p className="text-sm text-gray-500">
                    Describe your survey and I'll help you create it
                  </p>
                </div>
              </div>
              <button
                onClick={() => cancelMutation.mutate()}
                className="text-gray-400 hover:text-gray-600"
                title="Reset wizard"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm border'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-primary-100' : 'text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {sendMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your survey or ask for changes..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={sendMutation.isPending}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sendMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50 hover:bg-primary-700 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => handleQuickAction(action)}
                  className="text-xs px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {surveyDraft && (
          <div className="w-96 border-l bg-white flex flex-col">
            {/* Preview Header */}
            <div className="border-b p-4">
              <h2 className="font-semibold text-lg">{surveyDraft.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{surveyDraft.description}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MessageSquare className="w-4 h-4" />
                  <span>{getTotalQuestionCount()} questions</span>
                </div>
                {estimatedTime && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>
                      ~{estimatedTime.minutes} min ({estimatedTime.label})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {surveyDraft.pages.map((page, pageIndex) => (
                <div key={pageIndex} className="mb-6">
                  <h3 className="font-medium text-sm text-gray-500 mb-2 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    {page.title || `Section ${pageIndex + 1}`}
                  </h3>
                  <div className="space-y-2">
                    {page.questions.map((question, qIndex) => (
                      <div
                        key={qIndex}
                        className="bg-gray-50 rounded-lg border p-3 text-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex-1">{question.text}</span>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {question.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {question.options && question.options.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {question.options.slice(0, 4).map((opt, i) => (
                              <div key={i} className="text-xs text-gray-500 pl-2">
                                {opt.text}
                              </div>
                            ))}
                            {question.options.length > 4 && (
                              <div className="text-xs text-gray-400 pl-2">
                                +{question.options.length - 4} more options
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Create Button */}
            <div className="border-t p-4">
              <button
                onClick={() => finalizeMutation.mutate()}
                disabled={finalizeMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg disabled:opacity-50 hover:bg-primary-700 transition-colors font-medium"
              >
                {finalizeMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Survey
                  </>
                )}
              </button>
              <p className="text-xs text-center text-gray-500 mt-2">
                You can edit the survey after creation
              </p>
            </div>
          </div>
        )}
      </div>
    </AIProviderCheck>
  );
}
