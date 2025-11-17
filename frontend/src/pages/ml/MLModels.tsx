import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X, TrendingUp, Clock, CheckCircle, XCircle, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

interface MLModel {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  modelType: string;
  status: 'TRAINING' | 'READY' | 'FAILED' | 'ARCHIVED';
  accuracy?: number;
  targetColumn?: string;
  features: string[];
  createdAt: string;
  lastUsedAt?: string;
  toolConfig: {
    name: string;
    type: string;
  };
  survey?: {
    id: string;
    title: string;
  };
  _count?: {
    predictions: number;
  };
}

export default function MLModels() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    toolConfigId: '',
    name: '',
    displayName: '',
    description: '',
    modelType: 'classification',
    targetColumn: '',
    features: [] as string[],
    surveyId: '',
  });

  const { data: models } = useQuery({
    queryKey: ['ml-models'],
    queryFn: async () => {
      const response = await api.get('/ml/models');
      return response.data.data as MLModel[];
    },
  });

  const { data: aiTools } = useQuery({
    queryKey: ['ai-tools'],
    queryFn: async () => {
      const response = await api.get('/ai/tools');
      return response.data.data;
    },
  });

  const { data: surveys } = useQuery({
    queryKey: ['surveys-list'],
    queryFn: async () => {
      const response = await api.get('/surveys');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/ml/models', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-models'] });
      toast.success('Model training started!');
      setShowCreateForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create model');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ml/models/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-models'] });
      toast.success('Model deleted');
    },
    onError: () => {
      toast.error('Failed to delete model');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ml/models/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-models'] });
      toast.success('Model archived');
    },
    onError: () => {
      toast.error('Failed to archive model');
    },
  });

  const resetForm = () => {
    setFormData({
      toolConfigId: '',
      name: '',
      displayName: '',
      description: '',
      modelType: 'classification',
      targetColumn: '',
      features: [],
      surveyId: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'READY':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'TRAINING':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'ARCHIVED':
        return <Archive className="w-5 h-5 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'TRAINING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">ML Models</h1>
            <p className="text-gray-600">
              Train machine learning models on your survey data for predictions and insights.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary inline-flex items-center"
            disabled={!aiTools || aiTools.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Model
          </button>
        </div>
      </div>

      {/* Models Grid */}
      {models && models.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <Link
              key={model.id}
              to={`/ml/models/${model.id}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(model.status)}
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(model.status)}`}>
                    {model.status}
                  </span>
                </div>
                {model.accuracy && (
                  <div className="text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    {(model.accuracy * 100).toFixed(1)}%
                  </div>
                )}
              </div>

              <h3 className="font-bold text-lg mb-1">
                {model.displayName || model.name}
              </h3>

              {model.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {model.description}
                </p>
              )}

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Type:</span>
                  <span className="font-medium capitalize">{model.modelType}</span>
                </div>

                {model.targetColumn && (
                  <div className="flex items-center justify-between">
                    <span>Predicts:</span>
                    <span className="font-medium">{model.targetColumn}</span>
                  </div>
                )}

                {model.survey && (
                  <div className="flex items-center justify-between">
                    <span>Survey:</span>
                    <span className="font-medium truncate max-w-[150px]">{model.survey.title}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span>AI Tool:</span>
                  <span className="font-medium">{model.toolConfig.name}</span>
                </div>

                {model._count && model._count.predictions > 0 && (
                  <div className="flex items-center justify-between text-primary-600">
                    <span>Predictions:</span>
                    <span className="font-bold">{model._count.predictions}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    archiveMutation.mutate(model.id);
                  }}
                  className="flex-1 btn btn-secondary text-xs"
                  disabled={model.status === 'ARCHIVED'}
                >
                  <Archive className="w-3 h-3 mr-1" />
                  Archive
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm('Delete this model? This action cannot be undone.')) {
                      deleteMutation.mutate(model.id);
                    }
                  }}
                  className="btn btn-danger text-xs"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No ML Models Yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first model to start making predictions on your survey data.
          </p>
          {aiTools && aiTools.length === 0 && (
            <p className="text-sm text-gray-500">
              First, <Link to="/settings/ai-tools" className="text-primary-600 hover:underline">configure an AI tool</Link> to get started.
            </p>
          )}
        </div>
      )}

      {/* Create Model Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create ML Model</h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">AI Tool</label>
                <select
                  className="input"
                  value={formData.toolConfigId}
                  onChange={(e) => setFormData({ ...formData, toolConfigId: e.target.value })}
                  required
                >
                  <option value="">Select an AI tool</option>
                  {aiTools?.filter((tool: any) => tool.isEnabled).map((tool: any) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.name} ({tool.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Model Name (Technical)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                  placeholder="sentiment_predictor"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and underscores only</p>
              </div>

              <div>
                <label className="label">Display Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Sentiment Predictor"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Predicts sentiment from survey responses..."
                />
              </div>

              <div>
                <label className="label">Model Type</label>
                <select
                  className="input"
                  value={formData.modelType}
                  onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
                  required
                >
                  <option value="classification">Classification</option>
                  <option value="regression">Regression</option>
                  <option value="time_series">Time Series</option>
                  <option value="nlp">NLP (Natural Language)</option>
                  <option value="clustering">Clustering</option>
                </select>
              </div>

              <div>
                <label className="label">Survey (Optional)</label>
                <select
                  className="input"
                  value={formData.surveyId}
                  onChange={(e) => setFormData({ ...formData, surveyId: e.target.value })}
                >
                  <option value="">Select a survey</option>
                  {surveys?.map((survey: any) => (
                    <option key={survey.id} value={survey.id}>
                      {survey.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Use data from a specific survey</p>
              </div>

              <div>
                <label className="label">Target Column</label>
                <input
                  type="text"
                  className="input"
                  value={formData.targetColumn}
                  onChange={(e) => setFormData({ ...formData, targetColumn: e.target.value })}
                  placeholder="sentiment"
                />
                <p className="text-xs text-gray-500 mt-1">What the model should predict</p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create & Train Model'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
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
