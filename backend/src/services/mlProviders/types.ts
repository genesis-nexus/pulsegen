/**
 * ML Provider Abstraction Layer - Type Definitions
 *
 * This module defines the interfaces and types for ML providers,
 * allowing easy swapping between MindsDB, TensorFlow Serving, or custom implementations.
 */

// Supported ML Provider Types
export enum MLProviderType {
  MINDSDB = 'MINDSDB',
  TENSORFLOW_SERVING = 'TENSORFLOW_SERVING',
  CUSTOM_REST = 'CUSTOM_REST',
  LOCAL = 'LOCAL', // For future local model support
}

// Feature Types supported by the platform
export enum MLFeatureType {
  RESPONSE_QUALITY = 'RESPONSE_QUALITY',
  SENTIMENT_ANALYSIS = 'SENTIMENT_ANALYSIS',
  DROPOUT_PREDICTION = 'DROPOUT_PREDICTION',
}

// Base configuration for all providers
export interface MLProviderConfig {
  id: string;
  type: MLProviderType;
  name: string;
  endpoint: string;
  apiKey?: string;
  username?: string;
  password?: string;
  database?: string;
  settings?: Record<string, any>;
  isEnabled: boolean;
  timeout?: number; // Request timeout in ms
  retryAttempts?: number;
  retryDelay?: number; // Delay between retries in ms
}

// Model training configuration
export interface ModelTrainingConfig {
  name: string;
  displayName?: string;
  description?: string;
  modelType: string;
  targetColumn: string;
  features: string[];
  query?: string;
  dataSource?: string;
  engine?: string;
  trainingOptions?: Record<string, any>;
}

// Model information returned from provider
export interface ModelInfo {
  name: string;
  status: 'training' | 'ready' | 'failed' | 'unknown';
  accuracy?: number;
  trainingTime?: number;
  createdAt?: Date;
  metadata?: Record<string, any>;
}

// Prediction request
export interface PredictionRequest {
  modelName: string;
  input: Record<string, any> | Record<string, any>[];
  options?: {
    limit?: number;
    confidence_threshold?: number;
  };
}

// Single prediction result
export interface PredictionResult {
  prediction: any;
  confidence?: number;
  probabilities?: Record<string, number>;
  metadata?: Record<string, any>;
}

// Batch prediction result
export interface BatchPredictionResult {
  predictions: PredictionResult[];
  totalCount: number;
  processedCount: number;
  failedCount: number;
  errors?: Array<{ index: number; error: string }>;
}

// Connection test result
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
  version?: string;
}

// Response Quality specific types
export interface ResponseQualityInput {
  responseId: string;
  surveyId: string;
  answers: Array<{
    questionId: string;
    questionType: string;
    value: any;
    timeSpent?: number;
  }>;
  metadata: {
    totalTimeSpent: number;
    deviceType: string;
    pageTimings?: Record<string, number>;
  };
}

export interface ResponseQualityResult {
  qualityScore: number; // 0-100
  flags: Array<{
    type: 'SPEEDING' | 'STRAIGHT_LINING' | 'LOW_VARIANCE' | 'GIBBERISH' | 'PATTERN_DETECTED';
    severity: 'low' | 'medium' | 'high';
    message: string;
    affectedQuestions?: string[];
  }>;
  recommendation: 'ACCEPT' | 'REVIEW' | 'REJECT';
  confidence: number;
}

// Sentiment Analysis specific types
export interface SentimentInput {
  text: string;
  context?: {
    questionText?: string;
    surveyTitle?: string;
    language?: string;
  };
}

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number; // -1 to 1
  confidence: number;
  emotions?: Record<string, number>; // e.g., { joy: 0.8, anger: 0.1 }
  keywords?: string[];
}

// Dropout Prediction specific types
export interface DropoutPredictionInput {
  responseId: string;
  surveyId: string;
  currentPage: number;
  totalPages: number;
  questionsAnswered: number;
  totalQuestions: number;
  timeSpentSoFar: number; // seconds
  averageTimePerQuestion: number;
  deviceType: string;
  hourOfDay: number;
  dayOfWeek: number;
  previousDropouts?: number; // Historical dropout count for this user/IP
}

export interface DropoutPredictionResult {
  dropoutProbability: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  suggestedIntervention?: {
    type: 'NONE' | 'PROGRESS_BAR' | 'ENCOURAGEMENT' | 'SIMPLIFY' | 'SAVE_PROGRESS';
    message?: string;
  };
  confidence: number;
  factors?: Array<{
    factor: string;
    impact: number; // -1 to 1
    description: string;
  }>;
}

// Feature configuration
export interface MLFeatureConfig {
  id: string;
  featureType: MLFeatureType;
  name: string;
  description?: string;
  isEnabled: boolean;
  providerId: string; // Reference to ML provider
  modelName?: string; // Model name in provider
  settings: {
    // Response Quality settings
    speedingThresholdSeconds?: number;
    straightLiningThreshold?: number;
    minQualityScore?: number;
    autoRejectThreshold?: number;
    autoAcceptThreshold?: number;

    // Sentiment settings
    confidenceThreshold?: number;
    includeEmotions?: boolean;
    extractKeywords?: boolean;
    defaultLanguage?: string;

    // Dropout settings
    lowRiskThreshold?: number;
    mediumRiskThreshold?: number;
    highRiskThreshold?: number;
    enableInterventions?: boolean;
    interventionDelay?: number;
  };
  surveyOverrides?: Record<string, Partial<MLFeatureConfig['settings']>>; // Per-survey overrides
  createdAt: Date;
  updatedAt: Date;
}

// Provider capabilities
export interface ProviderCapabilities {
  supportedFeatures: MLFeatureType[];
  supportsBatchPrediction: boolean;
  supportsStreaming: boolean;
  supportsModelTraining: boolean;
  maxBatchSize: number;
  supportedModelTypes: string[];
}
