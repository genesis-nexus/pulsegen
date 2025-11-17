import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X, Eye, EyeOff, CheckCircle, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface AITool {
  id: string;
  type: string;
  name: string;
  endpoint: string;
  database?: string;
  isEnabled: boolean;
  isDefault: boolean;
  createdAt: string;
  _count?: {
    models: number;
  };
}

interface AvailableTool {
  type: string;
  name: string;
  description: string;
  features: string[];
  requiresEndpoint: boolean;
  requiresAuth: boolean;
  authTypes?: string[];
  website: string;
}

export default function AIToolsSettings() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    endpoint: '',
    authType: 'api_key',
    apiKey: '',
    username: '',
    password: '',
    database: '',
    settings: {},
    isEnabled: true,
    isDefault: false,
  });

  const { data: tools } = useQuery({
    queryKey: ['ai-tools'],
    queryFn: async () => {
      const response = await api.get('/ai/tools');
      return response.data.data as AITool[];
    },
  });

  const { data: availableTools } = useQuery({
    queryKey: ['available-ai-tools'],
    queryFn: async () => {
      const response = await api.get('/ai/tools/available');
      return response.data.data as AvailableTool[];
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => api.post('/ai/tools', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-tools'] });
      toast.success('AI tool added successfully');
      setShowAddForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add AI tool');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ai/tools/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-tools'] });
      toast.success('AI tool deleted');
    },
    onError: () => {
      toast.error('Failed to delete AI tool');
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ai/tools/${id}/test`),
    onSuccess: () => {
      toast.success('Connection successful!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Connection failed');
    },
  });

  const resetForm = () => {
    setFormData({
      type: '',
      name: '',
      endpoint: '',
      authType: 'api_key',
      apiKey: '',
      username: '',
      password: '',
      database: '',
      settings: {},
      isEnabled: true,
      isDefault: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: any = {
      type: formData.type,
      name: formData.name,
      endpoint: formData.endpoint,
      database: formData.database || undefined,
      settings: formData.settings,
      isEnabled: formData.isEnabled,
      isDefault: formData.isDefault,
    };

    if (formData.authType === 'api_key' && formData.apiKey) {
      submitData.apiKey = formData.apiKey;
    } else if (formData.authType === 'username_password' && formData.username && formData.password) {
      submitData.username = formData.username;
      submitData.password = formData.password;
    }

    addMutation.mutate(submitData);
  };

  const selectedToolInfo = availableTools?.find((t) => t.type === formData.type);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Tools & ML Platforms</h1>
        <p className="text-gray-600">
          Connect to AI tools like MindsDB, TensorFlow Serving, and more for advanced analytics and predictions.
        </p>
      </div>

      {/* Current Tools */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Configured Tools</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add AI Tool
          </button>
        </div>

        {tools && tools.length > 0 ? (
          <div className="space-y-4">
            {tools.map((tool) => {
              const info = availableTools?.find((t) => t.type === tool.type);
              return (
                <div
                  key={tool.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-5 h-5 text-gray-500" />
                      <h3 className="font-semibold">{tool.name}</h3>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                        {info?.name || tool.type}
                      </span>
                      {tool.isDefault && (
                        <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                          Default
                        </span>
                      )}
                      {tool.isEnabled ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Enabled
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Endpoint: {tool.endpoint}</p>
                      {tool.database && <p>Database: {tool.database}</p>}
                      {tool._count && tool._count.models > 0 && (
                        <p className="text-primary-600">
                          {tool._count.models} model{tool._count.models !== 1 ? 's' : ''} created
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => testConnectionMutation.mutate(tool.id)}
                      className="btn btn-secondary text-sm inline-flex items-center"
                      disabled={testConnectionMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Test
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this AI tool? All associated models will also be deleted.')) {
                          deleteMutation.mutate(tool.id);
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
            <Database className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p>No AI tools configured yet.</p>
            <p className="text-sm mt-2">Add an AI tool to start creating ML models and predictions.</p>
          </div>
        )}
      </div>

      {/* Add Tool Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add AI Tool</h2>
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
                <label className="label">Tool Type</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="">Select an AI tool</option>
                  {availableTools?.map((tool) => (
                    <option key={tool.type} value={tool.type}>
                      {tool.name}
                    </option>
                  ))}
                </select>
                {selectedToolInfo && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">{selectedToolInfo.description}</p>
                    <div className="text-xs text-gray-600">
                      <strong>Features:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {selectedToolInfo.features.map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    <a
                      href={selectedToolInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline mt-2 inline-block"
                    >
                      Learn more →
                    </a>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Configuration Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Production MindsDB"
                  required
                />
              </div>

              <div>
                <label className="label">API Endpoint</label>
                <input
                  type="url"
                  className="input"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  placeholder="https://cloud.mindsdb.com"
                  required
                />
              </div>

              {selectedToolInfo?.authTypes && selectedToolInfo.authTypes.length > 0 && (
                <div>
                  <label className="label">Authentication Method</label>
                  <select
                    className="input"
                    value={formData.authType}
                    onChange={(e) => setFormData({ ...formData, authType: e.target.value })}
                  >
                    {selectedToolInfo.authTypes.map((authType) => (
                      <option key={authType} value={authType}>
                        {authType.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.authType === 'api_key' && (
                <div>
                  <label className="label">API Key</label>
                  <div className="relative">
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      className="input pr-10"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecrets(!showSecrets)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {formData.authType === 'username_password' && (
                <>
                  <div>
                    <label className="label">Username</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <div className="relative">
                      <input
                        type={showSecrets ? 'text' : 'password'}
                        className="input pr-10"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecrets(!showSecrets)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {formData.type === 'MINDSDB' && (
                <div>
                  <label className="label">Database Name (Optional)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.database}
                    onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                    placeholder="mindsdb"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default database for creating models
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
                  <span className="text-sm">Enable this tool</span>
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
                  <span className="text-sm">Set as default AI tool</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                  disabled={addMutation.isPending}
                >
                  {addMutation.isPending ? 'Adding...' : 'Add AI Tool'}
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

      {/* Info Section */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2">What are AI Tools?</h3>
        <p className="text-sm text-gray-700 mb-3">
          AI Tools are platforms that enable you to train machine learning models on your survey data
          and make predictions. These tools can help you:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Predict future survey responses based on patterns</li>
          <li>Analyze sentiment and trends in responses</li>
          <li>Segment respondents automatically</li>
          <li>Generate insights from historical data</li>
          <li>Build custom ML models for your specific needs</li>
        </ul>
      </div>
    </div>
  );
}
