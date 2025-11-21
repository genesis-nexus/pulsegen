import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X, Eye, EyeOff, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface IdentityProvider {
  id: string;
  provider: string;
  name: string;
  clientId: string;
  isEnabled: boolean;
  isDefault: boolean;
  callbackUrl?: string;
  createdAt: string;
}

interface AvailableProvider {
  provider: string;
  name: string;
  description: string;
  requiresCallbackUrl: boolean;
  requiresIssuer?: boolean;
  requiresCertificate?: boolean;
  defaultScopes?: string[];
}

export default function SSOSettings() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [formData, setFormData] = useState({
    provider: '',
    name: '',
    clientId: '',
    clientSecret: '',
    issuer: '',
    callbackUrl: '',
    scopes: [] as string[],
    isEnabled: true,
    isDefault: false,
  });

  const { data: providers } = useQuery({
    queryKey: ['identity-providers'],
    queryFn: async () => {
      const response = await api.get('/identity/providers');
      return response.data.data as IdentityProvider[];
    },
  });

  const { data: availableProviders } = useQuery({
    queryKey: ['available-identity-providers'],
    queryFn: async () => {
      const response = await api.get('/identity/providers/available');
      return response.data.data as AvailableProvider[];
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => api.post('/identity/providers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identity-providers'] });
      toast.success('Identity provider added successfully');
      setShowAddForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add provider');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (provider: string) => api.delete(`/identity/providers/${provider}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identity-providers'] });
      toast.success('Identity provider deleted');
    },
    onError: () => {
      toast.error('Failed to delete provider');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ provider, isEnabled }: { provider: string; isEnabled: boolean }) =>
      api.patch(`/identity/providers/${provider}/toggle`, { isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identity-providers'] });
      toast.success('Provider status updated');
    },
  });

  const resetForm = () => {
    setFormData({
      provider: '',
      name: '',
      clientId: '',
      clientSecret: '',
      issuer: '',
      callbackUrl: '',
      scopes: [],
      isEnabled: true,
      isDefault: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.provider || !formData.clientId || !formData.clientSecret) {
      toast.error('Provider, Client ID, and Client Secret are required');
      return;
    }
    addMutation.mutate(formData);
  };

  const selectedProviderInfo = availableProviders?.find(
    (p) => p.provider === formData.provider
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SSO & Identity Providers</h1>
        <p className="text-gray-600">
          Configure Single Sign-On (SSO) providers for user authentication.
        </p>
      </div>

      {/* Current Providers */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Configured Providers</h2>
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
            {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{provider.name}</h3>
                      {provider.isDefault && (
                        <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                          Default
                        </span>
                      )}
                      {provider.isEnabled ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Enabled
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Client ID: {provider.clientId}</p>
                    {provider.callbackUrl && (
                      <p className="text-sm text-gray-600 mt-1">
                        Callback: {provider.callbackUrl}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        toggleMutation.mutate({
                          provider: provider.provider,
                          isEnabled: !provider.isEnabled,
                        })
                      }
                      className="btn btn-secondary text-sm inline-flex items-center"
                    >
                      <Power className="w-4 h-4 mr-1" />
                      {provider.isEnabled ? 'Disable' : 'Enable'}
                    </button>
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
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <p>No SSO providers configured yet.</p>
            <p className="text-sm mt-2">Add a provider to enable SSO authentication.</p>
          </div>
        )}
      </div>

      {/* Add Provider Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add SSO Provider</h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Provider Type</label>
                <select
                  className="input"
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value, name: '' })
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
                {selectedProviderInfo && (
                  <p className="text-sm text-gray-600 mt-1">{selectedProviderInfo.description}</p>
                )}
              </div>

              <div>
                <label className="label">Provider Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Company SSO"
                  required
                />
              </div>

              <div>
                <label className="label">Client ID</label>
                <input
                  type="text"
                  className="input"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Client Secret</label>
                <div className="relative">
                  <input
                    type={showClientSecret ? 'text' : 'password'}
                    className="input pr-10"
                    value={formData.clientSecret}
                    onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowClientSecret(!showClientSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {selectedProviderInfo?.requiresIssuer && (
                <div>
                  <label className="label">Issuer URL</label>
                  <input
                    type="url"
                    className="input"
                    value={formData.issuer}
                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    placeholder="https://your-domain.com"
                    required
                  />
                </div>
              )}

              {selectedProviderInfo?.requiresCallbackUrl && (
                <div>
                  <label className="label">Callback URL</label>
                  <input
                    type="url"
                    className="input"
                    value={formData.callbackUrl}
                    onChange={(e) => setFormData({ ...formData, callbackUrl: e.target.value })}
                    placeholder={`${window.location.origin}/api/auth/sso/${formData.provider}/callback`}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use this URL in your OAuth provider configuration
                  </p>
                </div>
              )}

              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Enable this provider</span>
                </label>
              </div>

              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
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
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
