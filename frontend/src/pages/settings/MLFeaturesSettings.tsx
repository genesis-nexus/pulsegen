import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  X,
  Settings,
  Shield,
  MessageSquare,
  Users,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

// Types
interface MLFeatureConfig {
  id: string;
  featureType: 'RESPONSE_QUALITY' | 'SENTIMENT_ANALYSIS' | 'DROPOUT_PREDICTION';
  name: string;
  description: string | null;
  isEnabled: boolean;
  isGlobal: boolean;
  providerId: string | null;
  providerType: string;
  modelName: string | null;
  settings: Record<string, any>;
  confidenceThreshold: number | null;
  batchSize: number | null;
  timeoutMs: number | null;
  createdAt: string;
  provider?: {
    id: string;
    name: string;
    type: string;
    isEnabled: boolean;
  };
  _count?: {
    qualityScores: number;
    sentimentScores: number;
    dropoutPredictions: number;
  };
}

interface AITool {
  id: string;
  type: string;
  name: string;
  isEnabled: boolean;
}

const FEATURE_INFO = {
  RESPONSE_QUALITY: {
    title: 'Response Quality Detection',
    description: 'Automatically detect low-quality responses including speeding, straight-lining, gibberish text, and suspicious patterns.',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  SENTIMENT_ANALYSIS: {
    title: 'Sentiment Analysis',
    description: 'Analyze sentiment in open-ended responses to understand positive, negative, and neutral feedback.',
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  DROPOUT_PREDICTION: {
    title: 'Dropout Prediction',
    description: 'Predict which respondents are likely to abandon the survey and suggest interventions.',
    icon: Users,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
};

const DEFAULT_SETTINGS = {
  RESPONSE_QUALITY: {
    speedingThresholdSeconds: 2,
    minimumTotalTimeSeconds: 30,
    straightLiningThreshold: 0.8,
    autoAcceptThreshold: 80,
    autoRejectThreshold: 30,
    detectPatterns: true,
    minTextLength: 10,
  },
  SENTIMENT_ANALYSIS: {
    confidenceThreshold: 0.6,
    includeEmotions: true,
    extractKeywords: true,
    defaultLanguage: 'en',
    mixedSentimentThreshold: 0.2,
  },
  DROPOUT_PREDICTION: {
    lowRiskThreshold: 0.25,
    mediumRiskThreshold: 0.5,
    highRiskThreshold: 0.75,
    enableInterventions: true,
    interventionDelay: 30,
    expectedTimePerQuestion: 15,
  },
};

export default function MLFeaturesSettings() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedConfig, setExpandedConfig] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<MLFeatureConfig | null>(null);
  const [formData, setFormData] = useState({
    featureType: '' as MLFeatureConfig['featureType'] | '',
    name: '',
    description: '',
    isEnabled: true,
    isGlobal: true,
    providerId: '',
    providerType: 'MINDSDB',
    modelName: '',
    settings: {} as Record<string, any>,
    confidenceThreshold: 0.7,
    batchSize: 100,
    timeoutMs: 30000,
  });

  // Queries
  const { data: configs, isLoading } = useQuery({
    queryKey: ['ml-feature-configs'],
    queryFn: async () => {
      const response = await api.get('/ml/features/configs');
      return response.data.data as MLFeatureConfig[];
    },
  });

  const { data: aiTools } = useQuery({
    queryKey: ['ai-tools'],
    queryFn: async () => {
      const response = await api.get('/ai/tools');
      return response.data.data as AITool[];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/ml/features/configs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-feature-configs'] });
      toast.success('Feature configuration created');
      setShowAddForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create configuration');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/ml/features/configs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-feature-configs'] });
      toast.success('Configuration updated');
      setEditingConfig(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update configuration');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ml/features/configs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-feature-configs'] });
      toast.success('Configuration deleted');
    },
    onError: () => {
      toast.error('Failed to delete configuration');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      api.patch(`/ml/features/configs/${id}/toggle`, { isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-feature-configs'] });
      toast.success('Feature toggled');
    },
    onError: () => {
      toast.error('Failed to toggle feature');
    },
  });

  const resetForm = () => {
    setFormData({
      featureType: '',
      name: '',
      description: '',
      isEnabled: true,
      isGlobal: true,
      providerId: '',
      providerType: 'MINDSDB',
      modelName: '',
      settings: {},
      confidenceThreshold: 0.7,
      batchSize: 100,
      timeoutMs: 30000,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      providerId: formData.providerId || undefined,
      modelName: formData.modelName || undefined,
      settings: Object.keys(formData.settings).length > 0
        ? formData.settings
        : DEFAULT_SETTINGS[formData.featureType as keyof typeof DEFAULT_SETTINGS] || {},
    };
    createMutation.mutate(submitData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;

    updateMutation.mutate({
      id: editingConfig.id,
      data: {
        name: editingConfig.name,
        description: editingConfig.description,
        isEnabled: editingConfig.isEnabled,
        isGlobal: editingConfig.isGlobal,
        providerId: editingConfig.providerId || undefined,
        modelName: editingConfig.modelName || undefined,
        settings: editingConfig.settings,
        confidenceThreshold: editingConfig.confidenceThreshold,
        batchSize: editingConfig.batchSize,
        timeoutMs: editingConfig.timeoutMs,
      },
    });
  };

  const getUsageCount = (config: MLFeatureConfig) => {
    if (!config._count) return 0;
    return (
      config._count.qualityScores +
      config._count.sentimentScores +
      config._count.dropoutPredictions
    );
  };

  // Group configs by feature type
  const groupedConfigs = configs?.reduce((acc, config) => {
    if (!acc[config.featureType]) {
      acc[config.featureType] = [];
    }
    acc[config.featureType].push(config);
    return acc;
  }, {} as Record<string, MLFeatureConfig[]>);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ML-Powered Features</h1>
        <p className="text-gray-600">
          Configure intelligent features powered by MindsDB to automatically analyze responses,
          detect quality issues, and predict respondent behavior.
        </p>
      </div>

      {/* Feature Overview Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {Object.entries(FEATURE_INFO).map(([type, info]) => {
          const Icon = info.icon;
          const typeConfigs = groupedConfigs?.[type] || [];
          const enabledCount = typeConfigs.filter((c) => c.isEnabled).length;

          return (
            <div
              key={type}
              className={`card ${info.bgColor} ${info.borderColor} border`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-white ${info.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{info.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      {typeConfigs.length} config{typeConfigs.length !== 1 ? 's' : ''}
                    </span>
                    {enabledCount > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        {enabledCount} active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Configuration Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Feature Configurations</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary inline-flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Configuration
        </button>
      </div>

      {/* Configurations List */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : configs && configs.length > 0 ? (
        <div className="space-y-4">
          {configs.map((config) => {
            const info = FEATURE_INFO[config.featureType];
            const Icon = info.icon;
            const isExpanded = expandedConfig === config.id;

            return (
              <div
                key={config.id}
                className={`card border ${config.isEnabled ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${info.bgColor} ${info.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{config.name}</h3>
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {info.title}
                        </span>
                        {config.isGlobal && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                            Global
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {config.description || 'No description'}
                        {config.provider && ` • Using ${config.provider.name}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {getUsageCount(config).toLocaleString()} uses
                    </span>
                    <button
                      onClick={() => toggleMutation.mutate({ id: config.id, isEnabled: !config.isEnabled })}
                      className={`p-1 rounded transition-colors ${
                        config.isEnabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={config.isEnabled ? 'Disable' : 'Enable'}
                    >
                      {config.isEnabled ? (
                        <ToggleRight className="w-8 h-8" />
                      ) : (
                        <ToggleLeft className="w-8 h-8" />
                      )}
                    </button>
                    <button
                      onClick={() => setExpandedConfig(isExpanded ? null : config.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Settings */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Settings Summary */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Settings</h4>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                          {Object.entries(config.settings || {}).slice(0, 6).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-500">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                          {config.confidenceThreshold && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Confidence Threshold:</span>
                              <span className="font-medium">{(config.confidenceThreshold * 100).toFixed(0)}%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Actions</h4>
                        <div className="space-y-2">
                          <button
                            onClick={() => setEditingConfig(config)}
                            className="w-full btn btn-secondary text-sm inline-flex items-center justify-center"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Edit Configuration
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this configuration?')) {
                                deleteMutation.mutate(config.id);
                              }
                            }}
                            className="w-full btn btn-danger text-sm inline-flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No Configurations Yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first ML feature configuration to start analyzing survey responses.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Configuration
          </button>
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Feature Configuration</h2>
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
                <label className="label">Feature Type</label>
                <select
                  className="input"
                  value={formData.featureType}
                  onChange={(e) => {
                    const type = e.target.value as MLFeatureConfig['featureType'];
                    setFormData({
                      ...formData,
                      featureType: type,
                      settings: DEFAULT_SETTINGS[type] || {},
                    });
                  }}
                  required
                >
                  <option value="">Select a feature</option>
                  {Object.entries(FEATURE_INFO).map(([type, info]) => (
                    <option key={type} value={type}>
                      {info.title}
                    </option>
                  ))}
                </select>
              </div>

              {formData.featureType && (
                <div className={`p-3 rounded-lg ${FEATURE_INFO[formData.featureType].bgColor}`}>
                  <p className="text-sm text-gray-700">
                    {FEATURE_INFO[formData.featureType].description}
                  </p>
                </div>
              )}

              <div>
                <label className="label">Configuration Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Default Quality Check"
                  required
                />
              </div>

              <div>
                <label className="label">Description (Optional)</label>
                <textarea
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this configuration is for..."
                  rows={2}
                />
              </div>

              <div>
                <label className="label">ML Provider (Optional)</label>
                <select
                  className="input"
                  value={formData.providerId}
                  onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                >
                  <option value="">Use rule-based detection (no ML)</option>
                  {aiTools?.filter((t) => t.isEnabled).map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.name} ({tool.type})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use built-in rule-based detection. Connect to MindsDB for ML-powered analysis.
                </p>
              </div>

              {formData.providerId && (
                <div>
                  <label className="label">Model Name (Optional)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.modelName}
                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                    placeholder="e.g., quality_predictor"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Name of the trained model in MindsDB. Leave empty to train a new model.
                  </p>
                </div>
              )}

              <div>
                <label className="label">Confidence Threshold</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.1"
                    max="0.99"
                    step="0.05"
                    value={formData.confidenceThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, confidenceThreshold: parseFloat(e.target.value) })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">
                    {(formData.confidenceThreshold * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Enable immediately</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isGlobal}
                    onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Apply to all surveys</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Configuration'}
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

      {/* Edit Form Modal */}
      {editingConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Configuration</h2>
              <button
                onClick={() => setEditingConfig(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="label">Configuration Name</label>
                <input
                  type="text"
                  className="input"
                  value={editingConfig.name}
                  onChange={(e) => setEditingConfig({ ...editingConfig, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  value={editingConfig.description || ''}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, description: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div>
                <label className="label">ML Provider</label>
                <select
                  className="input"
                  value={editingConfig.providerId || ''}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, providerId: e.target.value || null })
                  }
                >
                  <option value="">Use rule-based detection</option>
                  {aiTools?.filter((t) => t.isEnabled).map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Confidence Threshold</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.1"
                    max="0.99"
                    step="0.05"
                    value={editingConfig.confidenceThreshold || 0.7}
                    onChange={(e) =>
                      setEditingConfig({
                        ...editingConfig,
                        confidenceThreshold: parseFloat(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">
                    {((editingConfig.confidenceThreshold || 0.7) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Feature-specific settings */}
              <div>
                <label className="label">Feature Settings</label>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {editingConfig.featureType === 'RESPONSE_QUALITY' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Min seconds per question</label>
                          <input
                            type="number"
                            className="input text-sm"
                            value={editingConfig.settings.speedingThresholdSeconds || 2}
                            onChange={(e) =>
                              setEditingConfig({
                                ...editingConfig,
                                settings: {
                                  ...editingConfig.settings,
                                  speedingThresholdSeconds: parseInt(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Auto-accept threshold</label>
                          <input
                            type="number"
                            className="input text-sm"
                            value={editingConfig.settings.autoAcceptThreshold || 80}
                            onChange={(e) =>
                              setEditingConfig({
                                ...editingConfig,
                                settings: {
                                  ...editingConfig.settings,
                                  autoAcceptThreshold: parseInt(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Auto-reject threshold</label>
                          <input
                            type="number"
                            className="input text-sm"
                            value={editingConfig.settings.autoRejectThreshold || 30}
                            onChange={(e) =>
                              setEditingConfig({
                                ...editingConfig,
                                settings: {
                                  ...editingConfig.settings,
                                  autoRejectThreshold: parseInt(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Straight-lining threshold</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            className="input text-sm"
                            value={editingConfig.settings.straightLiningThreshold || 0.8}
                            onChange={(e) =>
                              setEditingConfig({
                                ...editingConfig,
                                settings: {
                                  ...editingConfig.settings,
                                  straightLiningThreshold: parseFloat(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {editingConfig.featureType === 'SENTIMENT_ANALYSIS' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Default language</label>
                          <select
                            className="input text-sm"
                            value={editingConfig.settings.defaultLanguage || 'en'}
                            onChange={(e) =>
                              setEditingConfig({
                                ...editingConfig,
                                settings: {
                                  ...editingConfig.settings,
                                  defaultLanguage: e.target.value,
                                },
                              })
                            }
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Mixed sentiment threshold</label>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="0.5"
                            className="input text-sm"
                            value={editingConfig.settings.mixedSentimentThreshold || 0.2}
                            onChange={(e) =>
                              setEditingConfig({
                                ...editingConfig,
                                settings: {
                                  ...editingConfig.settings,
                                  mixedSentimentThreshold: parseFloat(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={editingConfig.settings.includeEmotions !== false}
                          onChange={(e) =>
                            setEditingConfig({
                              ...editingConfig,
                              settings: {
                                ...editingConfig.settings,
                                includeEmotions: e.target.checked,
                              },
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">Include emotion detection</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={editingConfig.settings.extractKeywords !== false}
                          onChange={(e) =>
                            setEditingConfig({
                              ...editingConfig,
                              settings: {
                                ...editingConfig.settings,
                                extractKeywords: e.target.checked,
                              },
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">Extract keywords</span>
                      </label>
                    </>
                  )}

                  {editingConfig.featureType === 'DROPOUT_PREDICTION' && (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Low risk threshold</label>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            className="input text-sm"
                            value={editingConfig.settings.lowRiskThreshold || 0.25}
                            onChange={(e) =>
                              setEditingConfig({
                                ...editingConfig,
                                settings: {
                                  ...editingConfig.settings,
                                  lowRiskThreshold: parseFloat(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Medium risk threshold</label>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            className="input text-sm"
                            value={editingConfig.settings.mediumRiskThreshold || 0.5}
                            onChange={(e) =>
                              setEditingConfig({
                                ...editingConfig,
                                settings: {
                                  ...editingConfig.settings,
                                  mediumRiskThreshold: parseFloat(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">High risk threshold</label>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            className="input text-sm"
                            value={editingConfig.settings.highRiskThreshold || 0.75}
                            onChange={(e) =>
                              setEditingConfig({
                                ...editingConfig,
                                settings: {
                                  ...editingConfig.settings,
                                  highRiskThreshold: parseFloat(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={editingConfig.settings.enableInterventions !== false}
                          onChange={(e) =>
                            setEditingConfig({
                              ...editingConfig,
                              settings: {
                                ...editingConfig.settings,
                                enableInterventions: e.target.checked,
                              },
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">Enable automated interventions</span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={editingConfig.isEnabled}
                    onChange={(e) =>
                      setEditingConfig({ ...editingConfig, isEnabled: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Enabled</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={editingConfig.isGlobal}
                    onChange={(e) =>
                      setEditingConfig({ ...editingConfig, isGlobal: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Apply globally</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingConfig(null)}
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
      <div className="card bg-blue-50 border-blue-200 border mt-8">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">About ML Features</h3>
            <p className="text-sm text-blue-800 mb-2">
              These features can work in two modes:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>
                <strong>Rule-based (free):</strong> Uses built-in algorithms and heuristics.
                No external service required.
              </li>
              <li>
                <strong>ML-powered:</strong> Connect to MindsDB for more accurate predictions
                using trained machine learning models.
              </li>
            </ul>
            <p className="text-sm text-blue-800 mt-2">
              You can switch between modes anytime by updating the provider setting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
