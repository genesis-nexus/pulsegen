import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Sparkles,
  Loader2,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { AIProviderCheck } from '../components/ai';

interface Conversation {
  id: string;
  title: string;
  provider?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokensUsed?: number;
  createdAt: string;
}

interface ConversationDetail extends Conversation {
  messages: Message[];
}

export default function AIChat() {
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: async () => {
      const response = await api.get('/ai/chat/conversations');
      return response.data.data as Conversation[];
    },
  });

  // Fetch selected conversation
  const { data: conversation, isLoading: loadingConversation } = useQuery({
    queryKey: ['ai-conversation', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return null;
      const response = await api.get(`/ai/chat/conversations/${selectedConversation}`);
      return response.data.data as ConversationDetail;
    },
    enabled: !!selectedConversation,
  });

  // Create conversation mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/ai/chat/conversations', { title: 'New Conversation' });
      return response.data.data as Conversation;
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      setSelectedConversation(newConversation.id);
    },
    onError: () => toast.error('Failed to create conversation'),
  });

  // Delete conversation mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/ai/chat/conversations/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      if (selectedConversation === deletedId) {
        setSelectedConversation(null);
      }
      toast.success('Conversation deleted');
    },
    onError: () => toast.error('Failed to delete conversation'),
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async ({ conversationId, message }: { conversationId: string; message: string }) => {
      const response = await api.post(`/ai/chat/conversations/${conversationId}/messages`, { message });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversation', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      setMessage('');
    },
    onError: () => toast.error('Failed to send message'),
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSend = () => {
    if (!message.trim() || !selectedConversation) return;
    sendMutation.mutate({ conversationId: selectedConversation, message: message.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewConversation = () => {
    createMutation.mutate();
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <AIProviderCheck>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'w-72' : 'w-0'
          } bg-gray-50 border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}
        >
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={handleNewConversation}
              disabled={createMutation.isPending}
              className="w-full btn btn-primary flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conv.id
                        ? 'bg-primary-100 text-primary-900'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedConversation(conv.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-xs text-gray-500">
                        {conv._count.messages} messages - {formatDate(conv.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-14 px-4 border-b border-gray-200 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg hidden lg:block"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <span className="font-semibold">AI Chat</span>
            </div>
            {conversation?.model && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {conversation.model}
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedConversation ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Sparkles className="w-16 h-16 mb-4 text-primary-200" />
                <h2 className="text-xl font-semibold mb-2">Welcome to AI Chat</h2>
                <p className="text-center max-w-md mb-4">
                  Start a new conversation to ask questions about surveys, get help with data analysis,
                  or chat about anything else.
                </p>
                <button
                  onClick={handleNewConversation}
                  disabled={createMutation.isPending}
                  className="btn btn-primary"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Start New Chat
                </button>
              </div>
            ) : loadingConversation ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : conversation?.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <MessageSquare className="w-12 h-12 mb-4 text-gray-300" />
                <p>Send a message to start the conversation</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {conversation?.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      {msg.tokensUsed && (
                        <div
                          className={`text-xs mt-2 ${
                            msg.role === 'user' ? 'text-primary-200' : 'text-gray-400'
                          }`}
                        >
                          {msg.tokensUsed} tokens
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {sendMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-md">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          {selectedConversation && (
            <div className="p-4 border-t border-gray-200">
              <div className="max-w-3xl mx-auto flex gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 input resize-none"
                  disabled={sendMutation.isPending}
                  style={{ minHeight: '44px', maxHeight: '200px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sendMutation.isPending}
                  className="btn btn-primary px-4"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          )}
        </div>
      </div>
    </AIProviderCheck>
  );
}
