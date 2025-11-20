import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Check, X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface AIProvider {
  id: string;
  provider: string;
  modelName?: string;
  endpoint?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

interface AvailableProvider {
  provider: string;
  name: string;
  models: string[];
  defaultModel: string;
  requiresEndpoint: boolean;
}

export default function AISettings() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    provider: '',
    apiKey: '',
    modelName: '',
    endpoint: '',
    isDefault: false,
  });
  const [showApiKey, setShowApiKey] = useState(false);

  const { data: providers } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: async () => {
      const response = await api.get('/ai/providers');
      return response.data.data as AIProvider[];
    },
  });

  const { data: availableProviders } = useQuery({
    queryKey: ['available-providers'],
    queryFn: async () => {
      const response = await api.get('/ai/providers/available');
      return response.data.data as AvailableProvider[];
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => api.post('/ai/providers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      toast.success('AI provider added successfully');
      setShowAddForm(false);
      setFormData({
        provider: '',
        apiKey: '',
        modelName: '',
        endpoint: '',
        isDefault: false,
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add provider');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (provider: string) => api.delete(`/ai/providers/${provider}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      toast.success('AI provider deleted');
    },
    onError: () => {
      toast.error('Failed to delete provider');
    },
  });

  const toggleDefaultMutation = useMutation({
    mutationFn: ({ provider, isDefault }: { provider: string; isDefault: boolean }) =>
      api.put(`/ai/providers/${provider}`, { isDefault }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      toast.success('Default provider updated');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.provider || !formData.apiKey) {
      toast.error('Provider and API key are required');
      return;
    }
    addMutation.mutate(formData);
  };

  const selectedProviderInfo = availableProviders?.find(
    (p) => p.provider === formData.provider
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Settings</h1>
        <p className="text-gray-600">
          Configure AI providers for survey generation and analysis. Bring your own API keys.
        </p>
      </div>

      {/* Current Providers */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your AI Providers</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </button>
        </div>

        {providers && providers.length > 0 ? (
          <div className="space-y-4">
            {providers.map((provider) => {
              const info = availableProviders?.find((p) => p.provider === provider.provider);
              return (
                <div
                  key={provider.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{info?.name || provider.provider}</h3>
                      {provider.isDefault && (
                        <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                          Default
                        </span>
                      )}
                      {!provider.isActive && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    {provider.modelName && (
                      <p className="text-sm text-gray-600 mt-1">Model: {provider.modelName}</p>
                    )}
                    {provider.endpoint && (
                      <p className="text-sm text-gray-600 mt-1">
                        Endpoint: {provider.endpoint}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!provider.isDefault && (
                      <button
                        onClick={() =>
                          toggleDefaultMutation.mutate({
                            provider: provider.provider,
                            isDefault: true,
                          })
                        }
                        className="btn btn-secondary text-sm"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this provider?')) {
                          deleteMutation.mutate(provider.provider);
                        }
                      }}
                      className="btn btn-danger text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <p>No AI providers configured yet.</p>
            <p className="text-sm mt-2">Add an API key to enable AI features.</p>
          </div>
        )}
      </div>

      {/* Add Provider Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add AI Provider</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Provider</label>
                <select
                  className="input"
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value, modelName: '' })
                  }
                  required
                >
                  <option value="">Select a provider</option>
                  {availableProviders?.map((provider) => (
                    <option key={provider.provider} value={provider.provider}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    className="input pr-10"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Enter your API key"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {selectedProviderInfo && selectedProviderInfo.models.length > 0 && (
                <div>
                  <label className="label">Model (Optional)</label>
                  <select
                    className="input"
                    value={formData.modelName}
                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  >
                    <option value="">Default ({selectedProviderInfo.defaultModel})</option>
                    {selectedProviderInfo.models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedProviderInfo?.requiresEndpoint && (
                <div>
                  <label className="label">Endpoint URL</label>
                  <input
                    type="url"
                    className="input"
                    value={formData.endpoint}
                    onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                    placeholder="https://api.example.com"
                    required
                  />
                </div>
              )}

              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Set as default provider</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 btn btn-primary" disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Adding...' : 'Add Provider'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2">About AI Providers</h3>
        <p className="text-sm text-gray-700 mb-3">
          PulseGen uses AI to help you create better surveys and analyze responses. You'll need an
          API key from at least one provider to use AI features.
        </p>
        <div className="space-y-2 text-sm">
          <p>
            <strong>OpenRouter (Recommended - Free Tier Available):</strong> Get your API key from{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              openrouter.ai
            </a>
            {' '}- Provides access to multiple AI models including free options
          </p>
          <p>
            <strong>OpenAI:</strong> Get your API key from{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              platform.openai.com
            </a>
          </p>
          <p>
            <strong>Anthropic (Claude):</strong> Get your API key from{' '}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              console.anthropic.com
            </a>
          </p>
          <p>
            <strong>Google (Gemini):</strong> Get your API key from{' '}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              makersuite.google.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
