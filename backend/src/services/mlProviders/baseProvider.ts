/**
 * Base ML Provider - Abstract interface for all ML providers
 *
 * All ML providers (MindsDB, TensorFlow Serving, Custom) must implement this interface.
 * This allows easy swapping of providers without changing business logic.
 */

import {
  MLProviderConfig,
  MLProviderType,
  ModelTrainingConfig,
  ModelInfo,
  PredictionRequest,
  PredictionResult,
  BatchPredictionResult,
  ConnectionTestResult,
  ProviderCapabilities,
  MLFeatureType,
} from './types';

export abstract class BaseMLProvider {
  protected config: MLProviderConfig;
  protected isInitialized: boolean = false;

  constructor(config: MLProviderConfig) {
    this.config = config;
  }

  /**
   * Get provider type
   */
  abstract get providerType(): MLProviderType;

  /**
   * Get provider capabilities
   */
  abstract get capabilities(): ProviderCapabilities;

  /**
   * Initialize the provider connection
   */
  abstract initialize(): Promise<void>;

  /**
   * Test connection to the ML provider
   */
  abstract testConnection(): Promise<ConnectionTestResult>;

  /**
   * Create/train a new model
   */
  abstract createModel(config: ModelTrainingConfig): Promise<ModelInfo>;

  /**
   * Get model status and information
   */
  abstract getModelInfo(modelName: string): Promise<ModelInfo>;

  /**
   * Check if model is ready for predictions
   */
  abstract isModelReady(modelName: string): Promise<boolean>;

  /**
   * Make a single prediction
   */
  abstract predict(request: PredictionRequest): Promise<PredictionResult>;

  /**
   * Make batch predictions
   */
  abstract batchPredict(request: PredictionRequest): Promise<BatchPredictionResult>;

  /**
   * Delete a model
   */
  abstract deleteModel(modelName: string): Promise<void>;

  /**
   * List all models
   */
  abstract listModels(): Promise<ModelInfo[]>;

  /**
   * Execute raw query (provider-specific)
   */
  abstract executeRawQuery(query: string): Promise<any>;

  /**
   * Check if provider is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get provider configuration (sanitized - no secrets)
   */
  getConfigSanitized(): Omit<MLProviderConfig, 'apiKey' | 'password'> {
    const { apiKey, password, ...rest } = this.config;
    return rest;
  }

  /**
   * Utility: Retry an operation with exponential backoff
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries?: number,
    baseDelay?: number
  ): Promise<T> {
    const retries = maxRetries ?? this.config.retryAttempts ?? 3;
    const delay = baseDelay ?? this.config.retryDelay ?? 1000;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < retries) {
          const waitTime = delay * Math.pow(2, attempt);
          await this.sleep(waitTime);
        }
      }
    }

    throw lastError;
  }

  /**
   * Utility: Sleep helper
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Utility: Validate model name format
   */
  protected validateModelName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new Error('Model name is required');
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      throw new Error('Model name must start with a letter or underscore and contain only alphanumeric characters and underscores');
    }
    if (name.length > 64) {
      throw new Error('Model name must be 64 characters or less');
    }
  }
}
