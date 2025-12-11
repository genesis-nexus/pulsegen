/**
 * MindsDB Provider Implementation
 *
 * Implements the BaseMLProvider interface for MindsDB.
 * Supports both MindsDB Cloud (free tier) and self-hosted instances.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { BaseMLProvider } from './baseProvider';
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

export class MindsDBProvider extends BaseMLProvider {
  private client: AxiosInstance;
  private database: string;

  constructor(config: MLProviderConfig) {
    super(config);
    this.database = config.database || 'mindsdb';

    // Create axios client with authentication
    this.client = axios.create({
      baseURL: config.endpoint,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add authentication
    if (config.apiKey) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (config.username && config.password) {
      const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      this.client.defaults.headers.common['Authorization'] = `Basic ${credentials}`;
    }
  }

  get providerType(): MLProviderType {
    return MLProviderType.MINDSDB;
  }

  get capabilities(): ProviderCapabilities {
    return {
      supportedFeatures: [
        MLFeatureType.RESPONSE_QUALITY,
        MLFeatureType.SENTIMENT_ANALYSIS,
        MLFeatureType.DROPOUT_PREDICTION,
      ],
      supportsBatchPrediction: true,
      supportsStreaming: false,
      supportsModelTraining: true,
      maxBatchSize: 1000,
      supportedModelTypes: [
        'classification',
        'regression',
        'time_series',
        'text_classification',
        'anomaly_detection',
      ],
    };
  }

  async initialize(): Promise<void> {
    const testResult = await this.testConnection();
    if (!testResult.success) {
      throw new Error(`Failed to initialize MindsDB provider: ${testResult.message}`);
    }
    this.isInitialized = true;
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    try {
      // Try the status endpoint first
      try {
        const response = await this.client.get('/api/status');
        return {
          success: true,
          message: 'Connection successful',
          latency: Date.now() - startTime,
          version: response.data?.version,
        };
      } catch {
        // If status endpoint fails, try a simple SQL query
        await this.executeRawQuery('SELECT 1');
        return {
          success: true,
          message: 'Connection successful (via SQL)',
          latency: Date.now() - startTime,
        };
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        message: axiosError.message || 'Connection failed',
        latency: Date.now() - startTime,
      };
    }
  }

  async createModel(config: ModelTrainingConfig): Promise<ModelInfo> {
    this.validateModelName(config.name);

    // Build the CREATE MODEL query
    const modelName = this.getFullModelName(config.name);
    const usingClauses: string[] = [];

    if (config.engine) {
      usingClauses.push(`engine = '${config.engine}'`);
    }

    if (config.trainingOptions) {
      for (const [key, value] of Object.entries(config.trainingOptions)) {
        if (typeof value === 'string') {
          usingClauses.push(`${key} = '${value}'`);
        } else if (typeof value === 'object') {
          usingClauses.push(`${key} = ${JSON.stringify(value)}`);
        } else {
          usingClauses.push(`${key} = ${value}`);
        }
      }
    }

    let query: string;

    if (config.query) {
      // Custom query provided
      query = `
        CREATE MODEL ${modelName}
        FROM (${config.query})
        PREDICT ${config.targetColumn}
        ${usingClauses.length > 0 ? 'USING ' + usingClauses.join(', ') : ''}
      `;
    } else if (config.dataSource) {
      // Use data source
      query = `
        CREATE MODEL ${modelName}
        FROM ${config.dataSource}
        PREDICT ${config.targetColumn}
        ${usingClauses.length > 0 ? 'USING ' + usingClauses.join(', ') : ''}
      `;
    } else {
      throw new Error('Either query or dataSource must be provided for model training');
    }

    await this.executeRawQuery(query.trim());

    // Return initial model info (training status)
    return {
      name: config.name,
      status: 'training',
      metadata: {
        targetColumn: config.targetColumn,
        features: config.features,
        engine: config.engine,
      },
    };
  }

  async getModelInfo(modelName: string): Promise<ModelInfo> {
    const query = `
      SELECT name, status, accuracy, training_time, created_at
      FROM models
      WHERE name = '${modelName}'
    `;

    const response = await this.executeRawQuery(query);
    const data = response.data || response;

    if (!data || data.length === 0) {
      return {
        name: modelName,
        status: 'unknown',
      };
    }

    const model = Array.isArray(data) ? data[0] : data;

    return {
      name: model.name || modelName,
      status: this.mapMindsDBStatus(model.status),
      accuracy: model.accuracy ? parseFloat(model.accuracy) : undefined,
      trainingTime: model.training_time ? parseFloat(model.training_time) : undefined,
      createdAt: model.created_at ? new Date(model.created_at) : undefined,
      metadata: model,
    };
  }

  async isModelReady(modelName: string): Promise<boolean> {
    const info = await this.getModelInfo(modelName);
    return info.status === 'ready';
  }

  async predict(request: PredictionRequest): Promise<PredictionResult> {
    const modelName = this.getFullModelName(request.modelName);
    const input = Array.isArray(request.input) ? request.input[0] : request.input;

    // Build WHERE clause from input
    const whereConditions = Object.entries(input)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          // Escape single quotes in strings
          const escapedValue = value.replace(/'/g, "''");
          return `${key} = '${escapedValue}'`;
        } else if (value === null || value === undefined) {
          return `${key} IS NULL`;
        }
        return `${key} = ${value}`;
      })
      .join(' AND ');

    const query = `
      SELECT *
      FROM ${modelName}
      ${whereConditions ? `WHERE ${whereConditions}` : ''}
      LIMIT 1
    `;

    const response = await this.executeRawQuery(query);
    const data = response.data || response;

    if (!data || (Array.isArray(data) && data.length === 0)) {
      throw new Error('No prediction returned from model');
    }

    const result = Array.isArray(data) ? data[0] : data;

    // Extract prediction and confidence from result
    const predictionKeys = Object.keys(result).filter(
      k => !k.endsWith('_confidence') && !k.endsWith('_explain') && !Object.keys(input).includes(k)
    );
    const prediction = predictionKeys.length > 0 ? result[predictionKeys[0]] : result;

    // Look for confidence values
    let confidence: number | undefined;
    const confidenceKey = Object.keys(result).find(k => k.endsWith('_confidence'));
    if (confidenceKey) {
      confidence = parseFloat(result[confidenceKey]);
    }

    return {
      prediction,
      confidence,
      metadata: result,
    };
  }

  async batchPredict(request: PredictionRequest): Promise<BatchPredictionResult> {
    const inputs = Array.isArray(request.input) ? request.input : [request.input];
    const predictions: PredictionResult[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    // Process in batches to avoid overwhelming the server
    const batchSize = Math.min(this.capabilities.maxBatchSize, 100);

    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);

      // Process batch items concurrently
      const batchPromises = batch.map(async (input, batchIndex) => {
        const actualIndex = i + batchIndex;
        try {
          const result = await this.predict({
            modelName: request.modelName,
            input,
            options: request.options,
          });
          return { index: actualIndex, result, error: null };
        } catch (error) {
          return {
            index: actualIndex,
            result: null,
            error: (error as Error).message,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const { index, result, error } of batchResults) {
        if (result) {
          predictions.push(result);
        } else if (error) {
          errors.push({ index, error });
        }
      }
    }

    return {
      predictions,
      totalCount: inputs.length,
      processedCount: predictions.length,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async deleteModel(modelName: string): Promise<void> {
    const fullName = this.getFullModelName(modelName);
    const query = `DROP MODEL ${fullName}`;
    await this.executeRawQuery(query);
  }

  async listModels(): Promise<ModelInfo[]> {
    const query = 'SELECT name, status, accuracy, training_time, created_at FROM models';
    const response = await this.executeRawQuery(query);
    const data = response.data || response;

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((model: any) => ({
      name: model.name,
      status: this.mapMindsDBStatus(model.status),
      accuracy: model.accuracy ? parseFloat(model.accuracy) : undefined,
      trainingTime: model.training_time ? parseFloat(model.training_time) : undefined,
      createdAt: model.created_at ? new Date(model.created_at) : undefined,
    }));
  }

  async executeRawQuery(query: string): Promise<any> {
    const response = await this.retryWithBackoff(async () => {
      return this.client.post('/api/sql/query', {
        query: query.trim(),
      });
    });

    return response.data;
  }

  /**
   * Wait for model to be ready (with timeout)
   */
  async waitForModelReady(
    modelName: string,
    timeoutMs: number = 300000, // 5 minutes default
    pollIntervalMs: number = 5000
  ): Promise<ModelInfo> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const info = await this.getModelInfo(modelName);

      if (info.status === 'ready') {
        return info;
      }

      if (info.status === 'failed') {
        throw new Error(`Model training failed: ${JSON.stringify(info.metadata)}`);
      }

      await this.sleep(pollIntervalMs);
    }

    throw new Error(`Timeout waiting for model ${modelName} to be ready`);
  }

  /**
   * Get full model name with database prefix
   */
  private getFullModelName(modelName: string): string {
    return this.database ? `${this.database}.${modelName}` : modelName;
  }

  /**
   * Map MindsDB status to our standard status
   */
  private mapMindsDBStatus(status: string): ModelInfo['status'] {
    const statusMap: Record<string, ModelInfo['status']> = {
      complete: 'ready',
      training: 'training',
      generating: 'training',
      error: 'failed',
      failed: 'failed',
    };
    return statusMap[status?.toLowerCase()] || 'unknown';
  }
}
