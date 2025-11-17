import { PrismaClient, ModelStatus, AIToolType } from '@prisma/client';
import { aiToolsService } from './aiToolsService';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export interface CreateModelInput {
  toolConfigId: string;
  name: string;
  displayName?: string;
  description?: string;
  modelType: string;
  targetColumn?: string;
  features?: string[];
  surveyId?: string;
  query?: string;
  metadata?: any;
}

export interface PredictionInput {
  modelId: string;
  surveyId?: string;
  responseId?: string;
  input: any;
}

export const mlModelService = {
  async getAllModels(userId: string, filters?: {
    status?: ModelStatus;
    surveyId?: string;
    toolConfigId?: string;
  }) {
    const where: any = {
      createdBy: userId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.surveyId) {
      where.surveyId = filters.surveyId;
    }

    if (filters?.toolConfigId) {
      where.toolConfigId = filters.toolConfigId;
    }

    const models = await prisma.mLModel.findMany({
      where,
      include: {
        toolConfig: true,
        survey: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            predictions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return models;
  },

  async getModel(id: string, userId: string) {
    const model = await prisma.mLModel.findUnique({
      where: { id },
      include: {
        toolConfig: true,
        survey: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        predictions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            predictions: true,
          },
        },
      },
    });

    if (!model) {
      throw new AppError(404, 'Model not found');
    }

    if (model.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    return model;
  },

  async createModel(userId: string, data: CreateModelInput) {
    const toolConfig = await aiToolsService.getConfig(data.toolConfigId);
    if (!toolConfig) {
      throw new AppError(404, 'AI tool configuration not found');
    }

    if (!toolConfig.isEnabled) {
      throw new AppError(400, 'AI tool is not enabled');
    }

    // Create model in database with TRAINING status
    const model = await prisma.mLModel.create({
      data: {
        toolConfigId: data.toolConfigId,
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        modelType: data.modelType,
        targetColumn: data.targetColumn,
        features: data.features || [],
        surveyId: data.surveyId,
        query: data.query,
        metadata: data.metadata,
        status: ModelStatus.TRAINING,
        createdBy: userId,
      },
    });

    // Train model asynchronously based on tool type
    if (toolConfig.type === AIToolType.MINDSDB) {
      this.trainMindsDBModel(model.id, toolConfig, data).catch((error) => {
        console.error('Failed to train model:', error);
        // Update model status to FAILED
        prisma.mLModel.update({
          where: { id: model.id },
          data: {
            status: ModelStatus.FAILED,
            metadata: {
              ...data.metadata,
              error: error.message,
            },
          },
        }).catch(console.error);
      });
    }

    return model;
  },

  async trainMindsDBModel(modelId: string, toolConfig: any, data: CreateModelInput) {
    const client = aiToolsService.getClient(toolConfig) as any;

    // Build data source query - either from survey data or custom query
    let fromTable = 'pulsegen_data';
    if (data.query) {
      fromTable = `(${data.query})`;
    } else if (data.surveyId) {
      fromTable = `survey_${data.surveyId}_responses`;
    }

    // Create model in MindsDB
    await client.createModel({
      name: data.name,
      fromTable,
      predictColumn: data.targetColumn || 'target',
      features: data.features,
      engine: data.metadata?.engine || 'lightwood',
    });

    // Poll for model status
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResult = await client.getModelStatus(data.name);

      if (statusResult.data && statusResult.data.length > 0) {
        const modelStatus = statusResult.data[0];

        if (modelStatus.status === 'complete') {
          // Update model to READY
          await prisma.mLModel.update({
            where: { id: modelId },
            data: {
              status: ModelStatus.READY,
              accuracy: modelStatus.accuracy ? parseFloat(modelStatus.accuracy) : null,
              metadata: {
                ...data.metadata,
                trainingTime: modelStatus.training_time,
                completedAt: new Date().toISOString(),
              },
            },
          });
          return;
        } else if (modelStatus.status === 'error') {
          throw new Error('Model training failed in MindsDB');
        }
      }

      attempts++;
    }

    throw new Error('Model training timeout');
  },

  async updateModel(id: string, userId: string, data: Partial<CreateModelInput>) {
    const model = await this.getModel(id, userId);

    const updated = await prisma.mLModel.update({
      where: { id },
      data: {
        displayName: data.displayName,
        description: data.description,
        metadata: data.metadata,
      },
    });

    return updated;
  },

  async deleteModel(id: string, userId: string) {
    const model = await this.getModel(id, userId);

    // Delete model from AI tool if it exists
    try {
      const toolConfig = await aiToolsService.getConfig(model.toolConfigId);
      if (toolConfig && toolConfig.isEnabled && toolConfig.type === AIToolType.MINDSDB) {
        const client = aiToolsService.getClient(toolConfig) as any;
        await client.dropModel(model.name);
      }
    } catch (error) {
      console.error('Failed to delete model from AI tool:', error);
      // Continue with deletion from database
    }

    await prisma.mLModel.delete({
      where: { id },
    });
  },

  async archiveModel(id: string, userId: string) {
    const model = await this.getModel(id, userId);

    const updated = await prisma.mLModel.update({
      where: { id },
      data: {
        status: ModelStatus.ARCHIVED,
      },
    });

    return updated;
  },

  async predict(userId: string, data: PredictionInput) {
    const model = await this.getModel(data.modelId, userId);

    if (model.status !== ModelStatus.READY) {
      throw new AppError(400, 'Model is not ready for predictions');
    }

    const toolConfig = await aiToolsService.getConfig(model.toolConfigId);
    if (!toolConfig || !toolConfig.isEnabled) {
      throw new AppError(400, 'AI tool is not available');
    }

    // Get prediction from AI tool
    let predictionResult: any;

    if (toolConfig.type === AIToolType.MINDSDB) {
      const client = aiToolsService.getClient(toolConfig) as any;
      predictionResult = await client.predict({
        modelName: model.name,
        where: data.input,
        limit: 1,
      });
    } else {
      throw new AppError(400, 'Unsupported AI tool type');
    }

    // Extract result and confidence
    const output = predictionResult.data && predictionResult.data.length > 0
      ? predictionResult.data[0]
      : {};

    const confidence = output.confidence || output[`${model.targetColumn}_confidence`] || null;

    // Store prediction in database
    const prediction = await prisma.prediction.create({
      data: {
        modelId: data.modelId,
        surveyId: data.surveyId,
        responseId: data.responseId,
        input: data.input,
        output,
        confidence,
        metadata: {
          toolType: toolConfig.type,
          modelName: model.name,
        },
      },
    });

    // Update model's last used timestamp
    await prisma.mLModel.update({
      where: { id: data.modelId },
      data: { lastUsedAt: new Date() },
    });

    return prediction;
  },

  async batchPredict(userId: string, modelId: string, inputs: any[]) {
    const predictions = [];

    for (const input of inputs) {
      const prediction = await this.predict(userId, {
        modelId,
        input,
      });
      predictions.push(prediction);
    }

    return predictions;
  },

  async getPredictions(modelId: string, userId: string, filters?: {
    surveyId?: string;
    responseId?: string;
    limit?: number;
  }) {
    // Verify access
    await this.getModel(modelId, userId);

    const where: any = {
      modelId,
    };

    if (filters?.surveyId) {
      where.surveyId = filters.surveyId;
    }

    if (filters?.responseId) {
      where.responseId = filters.responseId;
    }

    const predictions = await prisma.prediction.findMany({
      where,
      include: {
        survey: {
          select: {
            id: true,
            title: true,
          },
        },
        response: {
          select: {
            id: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
    });

    return predictions;
  },

  async getModelStats(modelId: string, userId: string) {
    const model = await this.getModel(modelId, userId);

    const stats = await prisma.prediction.aggregate({
      where: { modelId },
      _count: true,
      _avg: {
        confidence: true,
      },
    });

    return {
      model,
      totalPredictions: stats._count,
      averageConfidence: stats._avg.confidence,
    };
  },
};
