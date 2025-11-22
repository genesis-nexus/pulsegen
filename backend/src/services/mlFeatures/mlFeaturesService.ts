/**
 * ML Features Service
 *
 * Unified service for managing all ML-powered features.
 * Handles configuration, initialization, and execution of:
 * - Response Quality Detection
 * - Sentiment Analysis
 * - Dropout Prediction
 */

import {
  PrismaClient,
  MLFeatureType as PrismaMLFeatureType,
  MLProviderType as PrismaMLProviderType,
} from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { aiToolsService } from '../aiToolsService';
import {
  MLFeatureType,
  MLProviderType,
  MLFeatureConfig,
  ResponseQualityInput,
  ResponseQualityResult,
  SentimentInput,
  SentimentResult,
  DropoutPredictionInput,
  DropoutPredictionResult,
} from '../mlProviders/types';
import { getOrCreateProvider, providerCache } from '../mlProviders/providerFactory';
import {
  ResponseQualityDetector,
  ResponseQualitySettings,
} from './responseQualityDetector';
import {
  SentimentAnalyzer,
  SentimentAnalysisSettings,
} from './sentimentAnalyzer';
import {
  DropoutPredictor,
  DropoutPredictionSettings,
} from './dropoutPredictor';

const prisma = new PrismaClient();

// Feature-specific settings types
type FeatureSettings =
  | ResponseQualitySettings
  | SentimentAnalysisSettings
  | DropoutPredictionSettings;

// Input types for creating/updating feature configs
export interface CreateFeatureConfigInput {
  featureType: PrismaMLFeatureType;
  name: string;
  description?: string;
  isEnabled?: boolean;
  isGlobal?: boolean;
  providerId?: string;
  providerType?: PrismaMLProviderType;
  modelName?: string;
  settings?: Record<string, any>;
  confidenceThreshold?: number;
  batchSize?: number;
  timeoutMs?: number;
}

export interface UpdateFeatureConfigInput {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  isGlobal?: boolean;
  providerId?: string;
  providerType?: PrismaMLProviderType;
  modelName?: string;
  settings?: Record<string, any>;
  confidenceThreshold?: number;
  batchSize?: number;
  timeoutMs?: number;
}

export interface SurveyOverrideInput {
  surveyId: string;
  isEnabled?: boolean;
  settings?: Record<string, any>;
}

// Cached feature instances
const featureInstances: Map<string, ResponseQualityDetector | SentimentAnalyzer | DropoutPredictor> = new Map();

export const mlFeaturesService = {
  // ============================================================================
  // FEATURE CONFIGURATION MANAGEMENT
  // ============================================================================

  /**
   * Get all feature configurations
   */
  async getAllFeatureConfigs() {
    const configs = await prisma.mLFeatureConfig.findMany({
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
            isEnabled: true,
          },
        },
        surveyOverrides: {
          include: {
            survey: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        _count: {
          select: {
            qualityScores: true,
            sentimentScores: true,
            dropoutPredictions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return configs;
  },

  /**
   * Get feature configurations by type
   */
  async getFeatureConfigsByType(featureType: PrismaMLFeatureType) {
    const configs = await prisma.mLFeatureConfig.findMany({
      where: { featureType },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
            isEnabled: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return configs;
  },

  /**
   * Get a single feature configuration
   */
  async getFeatureConfig(id: string) {
    const config = await prisma.mLFeatureConfig.findUnique({
      where: { id },
      include: {
        provider: true,
        surveyOverrides: {
          include: {
            survey: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!config) {
      throw new AppError(404, 'Feature configuration not found');
    }

    return config;
  },

  /**
   * Get enabled feature config for a specific type and survey
   */
  async getEnabledFeatureForSurvey(featureType: PrismaMLFeatureType, surveyId: string) {
    // First check for survey-specific override
    const override = await prisma.mLFeatureSurveyOverride.findFirst({
      where: {
        surveyId,
        featureConfig: {
          featureType,
        },
      },
      include: {
        featureConfig: {
          include: {
            provider: true,
          },
        },
      },
    });

    if (override) {
      if (!override.isEnabled) {
        return null; // Feature explicitly disabled for this survey
      }
      // Merge settings
      return {
        ...override.featureConfig,
        settings: {
          ...(override.featureConfig.settings as object),
          ...(override.settings as object || {}),
        },
      };
    }

    // Fall back to global config
    const globalConfig = await prisma.mLFeatureConfig.findFirst({
      where: {
        featureType,
        isEnabled: true,
        isGlobal: true,
      },
      include: {
        provider: true,
      },
    });

    return globalConfig;
  },

  /**
   * Create a new feature configuration
   */
  async createFeatureConfig(userId: string, input: CreateFeatureConfigInput) {
    // Validate provider if specified
    if (input.providerId) {
      const provider = await aiToolsService.getConfig(input.providerId);
      if (!provider) {
        throw new AppError(404, 'AI tool provider not found');
      }
    }

    // Check for duplicate name within feature type
    const existing = await prisma.mLFeatureConfig.findFirst({
      where: {
        featureType: input.featureType,
        name: input.name,
      },
    });

    if (existing) {
      throw new AppError(400, `Configuration "${input.name}" already exists for this feature type`);
    }

    const config = await prisma.mLFeatureConfig.create({
      data: {
        featureType: input.featureType,
        name: input.name,
        description: input.description,
        isEnabled: input.isEnabled ?? false,
        isGlobal: input.isGlobal ?? true,
        providerId: input.providerId,
        providerType: input.providerType ?? 'MINDSDB',
        modelName: input.modelName,
        settings: input.settings ?? this.getDefaultSettings(input.featureType),
        confidenceThreshold: input.confidenceThreshold ?? 0.7,
        batchSize: input.batchSize ?? 100,
        timeoutMs: input.timeoutMs ?? 30000,
        createdBy: userId,
      },
      include: {
        provider: true,
      },
    });

    return config;
  },

  /**
   * Update a feature configuration
   */
  async updateFeatureConfig(id: string, input: UpdateFeatureConfigInput) {
    const existing = await this.getFeatureConfig(id);

    // Validate provider if changing
    if (input.providerId && input.providerId !== existing.providerId) {
      const provider = await aiToolsService.getConfig(input.providerId);
      if (!provider) {
        throw new AppError(404, 'AI tool provider not found');
      }
    }

    const config = await prisma.mLFeatureConfig.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        isEnabled: input.isEnabled,
        isGlobal: input.isGlobal,
        providerId: input.providerId,
        providerType: input.providerType,
        modelName: input.modelName,
        settings: input.settings,
        confidenceThreshold: input.confidenceThreshold,
        batchSize: input.batchSize,
        timeoutMs: input.timeoutMs,
      },
      include: {
        provider: true,
      },
    });

    // Clear cached instance if settings changed
    featureInstances.delete(id);

    return config;
  },

  /**
   * Delete a feature configuration
   */
  async deleteFeatureConfig(id: string) {
    await this.getFeatureConfig(id); // Verify exists

    await prisma.mLFeatureConfig.delete({
      where: { id },
    });

    // Clear cached instance
    featureInstances.delete(id);

    return { success: true };
  },

  /**
   * Toggle feature enabled state
   */
  async toggleFeature(id: string, isEnabled: boolean) {
    await this.getFeatureConfig(id);

    const config = await prisma.mLFeatureConfig.update({
      where: { id },
      data: { isEnabled },
    });

    return config;
  },

  // ============================================================================
  // SURVEY OVERRIDES
  // ============================================================================

  /**
   * Create or update survey-specific override
   */
  async setSurveyOverride(featureConfigId: string, input: SurveyOverrideInput) {
    await this.getFeatureConfig(featureConfigId);

    // Verify survey exists
    const survey = await prisma.survey.findUnique({
      where: { id: input.surveyId },
    });

    if (!survey) {
      throw new AppError(404, 'Survey not found');
    }

    const override = await prisma.mLFeatureSurveyOverride.upsert({
      where: {
        featureConfigId_surveyId: {
          featureConfigId,
          surveyId: input.surveyId,
        },
      },
      create: {
        featureConfigId,
        surveyId: input.surveyId,
        isEnabled: input.isEnabled ?? true,
        settings: input.settings,
      },
      update: {
        isEnabled: input.isEnabled,
        settings: input.settings,
      },
      include: {
        survey: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return override;
  },

  /**
   * Delete survey override
   */
  async deleteSurveyOverride(featureConfigId: string, surveyId: string) {
    await prisma.mLFeatureSurveyOverride.delete({
      where: {
        featureConfigId_surveyId: {
          featureConfigId,
          surveyId,
        },
      },
    });

    return { success: true };
  },

  // ============================================================================
  // FEATURE EXECUTION
  // ============================================================================

  /**
   * Analyze response quality
   */
  async analyzeResponseQuality(
    input: ResponseQualityInput,
    configId?: string
  ): Promise<ResponseQualityResult & { configId?: string }> {
    const startTime = Date.now();

    // Get appropriate config
    let config = configId
      ? await this.getFeatureConfig(configId)
      : await this.getEnabledFeatureForSurvey('RESPONSE_QUALITY', input.surveyId);

    if (!config || !config.isEnabled) {
      throw new AppError(400, 'Response quality feature is not enabled');
    }

    // Get or create detector instance
    const detector = await this.getResponseQualityDetector(config);
    const result = await detector.analyzeQuality(input);

    // Store result
    await prisma.responseQualityScore.create({
      data: {
        responseId: input.responseId,
        featureConfigId: config.id,
        qualityScore: result.qualityScore,
        recommendation: result.recommendation,
        confidence: result.confidence,
        flags: result.flags as any,
        processingTimeMs: Date.now() - startTime,
        modelVersion: config.modelName || 'rule-based',
      },
    });

    return { ...result, configId: config.id };
  },

  /**
   * Analyze sentiment
   */
  async analyzeSentiment(
    input: SentimentInput,
    options?: {
      configId?: string;
      surveyId?: string;
      answerId?: string;
    }
  ): Promise<SentimentResult & { configId?: string }> {
    const startTime = Date.now();

    // Get appropriate config
    let config = options?.configId
      ? await this.getFeatureConfig(options.configId)
      : options?.surveyId
        ? await this.getEnabledFeatureForSurvey('SENTIMENT_ANALYSIS', options.surveyId)
        : await prisma.mLFeatureConfig.findFirst({
            where: { featureType: 'SENTIMENT_ANALYSIS', isEnabled: true },
            include: { provider: true },
          });

    if (!config || !config.isEnabled) {
      throw new AppError(400, 'Sentiment analysis feature is not enabled');
    }

    // Get or create analyzer instance
    const analyzer = await this.getSentimentAnalyzer(config);
    const result = await analyzer.analyzeSentiment(input);

    // Store result
    await prisma.sentimentScore.create({
      data: {
        featureConfigId: config.id,
        answerId: options?.answerId,
        surveyId: options?.surveyId,
        sourceText: input.text.substring(0, 1000), // Truncate for storage
        sentiment: result.sentiment,
        score: result.score,
        confidence: result.confidence,
        emotions: result.emotions as any,
        keywords: result.keywords || [],
        processingTimeMs: Date.now() - startTime,
        modelVersion: config.modelName || 'lexicon-based',
        language: input.context?.language,
      },
    });

    return { ...result, configId: config.id };
  },

  /**
   * Batch analyze sentiment for multiple texts
   */
  async analyzeSentimentBatch(
    inputs: Array<SentimentInput & { answerId?: string }>,
    options?: {
      configId?: string;
      surveyId?: string;
    }
  ): Promise<Array<SentimentResult & { answerId?: string }>> {
    // Get config once
    let config = options?.configId
      ? await this.getFeatureConfig(options.configId)
      : options?.surveyId
        ? await this.getEnabledFeatureForSurvey('SENTIMENT_ANALYSIS', options.surveyId)
        : await prisma.mLFeatureConfig.findFirst({
            where: { featureType: 'SENTIMENT_ANALYSIS', isEnabled: true },
            include: { provider: true },
          });

    if (!config || !config.isEnabled) {
      throw new AppError(400, 'Sentiment analysis feature is not enabled');
    }

    const analyzer = await this.getSentimentAnalyzer(config);
    const results: Array<SentimentResult & { answerId?: string }> = [];

    for (const input of inputs) {
      const { answerId, ...sentimentInput } = input;
      const result = await analyzer.analyzeSentiment(sentimentInput);
      results.push({ ...result, answerId });
    }

    return results;
  },

  /**
   * Predict dropout
   */
  async predictDropout(
    input: DropoutPredictionInput,
    configId?: string
  ): Promise<DropoutPredictionResult & { configId?: string }> {
    const startTime = Date.now();

    // Get appropriate config
    let config = configId
      ? await this.getFeatureConfig(configId)
      : await this.getEnabledFeatureForSurvey('DROPOUT_PREDICTION', input.surveyId);

    if (!config || !config.isEnabled) {
      throw new AppError(400, 'Dropout prediction feature is not enabled');
    }

    // Get or create predictor instance
    const predictor = await this.getDropoutPredictor(config);
    const result = await predictor.predictDropout(input);

    // Store result
    await prisma.dropoutPrediction.create({
      data: {
        responseId: input.responseId,
        featureConfigId: config.id,
        currentPage: input.currentPage,
        questionsAnswered: input.questionsAnswered,
        dropoutProbability: result.dropoutProbability,
        riskLevel: result.riskLevel,
        confidence: result.confidence,
        factors: result.factors as any,
        interventionType: result.suggestedIntervention?.type,
        interventionShown: false,
        processingTimeMs: Date.now() - startTime,
        modelVersion: config.modelName || 'rule-based',
      },
    });

    return { ...result, configId: config.id };
  },

  /**
   * Mark intervention as shown
   */
  async markInterventionShown(predictionId: string) {
    await prisma.dropoutPrediction.update({
      where: { id: predictionId },
      data: { interventionShown: true },
    });
  },

  // ============================================================================
  // STATISTICS AND REPORTING
  // ============================================================================

  /**
   * Get quality statistics for a survey
   */
  async getQualityStats(surveyId: string) {
    const scores = await prisma.responseQualityScore.findMany({
      where: {
        response: { surveyId },
      },
    });

    const distribution = {
      ACCEPT: 0,
      REVIEW: 0,
      REJECT: 0,
    };

    let totalScore = 0;
    let flagCounts: Record<string, number> = {};

    for (const score of scores) {
      distribution[score.recommendation as keyof typeof distribution]++;
      totalScore += score.qualityScore;

      const flags = score.flags as any[];
      for (const flag of flags || []) {
        flagCounts[flag.type] = (flagCounts[flag.type] || 0) + 1;
      }
    }

    return {
      totalAnalyzed: scores.length,
      averageScore: scores.length > 0 ? totalScore / scores.length : 0,
      recommendationDistribution: distribution,
      topFlags: Object.entries(flagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([flag, count]) => ({ flag, count })),
    };
  },

  /**
   * Get sentiment statistics for a survey
   */
  async getSentimentStats(surveyId: string) {
    const scores = await prisma.sentimentScore.findMany({
      where: { surveyId },
    });

    const distribution = {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0,
    };

    let totalScore = 0;
    const allEmotions: Record<string, number> = {};
    const allKeywords: Record<string, number> = {};

    for (const score of scores) {
      distribution[score.sentiment as keyof typeof distribution]++;
      totalScore += score.score;

      const emotions = score.emotions as Record<string, number> | null;
      if (emotions) {
        for (const [emotion, value] of Object.entries(emotions)) {
          allEmotions[emotion] = (allEmotions[emotion] || 0) + value;
        }
      }

      for (const keyword of score.keywords) {
        allKeywords[keyword] = (allKeywords[keyword] || 0) + 1;
      }
    }

    return {
      totalAnalyzed: scores.length,
      averageScore: scores.length > 0 ? totalScore / scores.length : 0,
      sentimentDistribution: distribution,
      topEmotions: Object.entries(allEmotions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([emotion, count]) => ({ emotion, count })),
      topKeywords: Object.entries(allKeywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([keyword, count]) => ({ keyword, count })),
    };
  },

  /**
   * Get dropout statistics for a survey
   */
  async getDropoutStats(surveyId: string) {
    const predictions = await prisma.dropoutPrediction.findMany({
      where: {
        response: { surveyId },
      },
    });

    const riskDistribution = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let totalProb = 0;
    let interventionsShown = 0;
    const pageStats: Record<number, { count: number; totalProb: number }> = {};

    for (const pred of predictions) {
      riskDistribution[pred.riskLevel as keyof typeof riskDistribution]++;
      totalProb += pred.dropoutProbability;

      if (pred.interventionShown) {
        interventionsShown++;
      }

      if (!pageStats[pred.currentPage]) {
        pageStats[pred.currentPage] = { count: 0, totalProb: 0 };
      }
      pageStats[pred.currentPage].count++;
      pageStats[pred.currentPage].totalProb += pred.dropoutProbability;
    }

    return {
      totalPredictions: predictions.length,
      averageDropoutProbability: predictions.length > 0 ? totalProb / predictions.length : 0,
      riskDistribution,
      interventionsShown,
      dropoutsByPage: Object.entries(pageStats)
        .map(([page, stats]) => ({
          page: parseInt(page),
          count: stats.count,
          avgProbability: stats.totalProb / stats.count,
        }))
        .sort((a, b) => a.page - b.page),
    };
  },

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get default settings for a feature type
   */
  getDefaultSettings(featureType: PrismaMLFeatureType): Record<string, any> {
    switch (featureType) {
      case 'RESPONSE_QUALITY':
        return {
          speedingThresholdSeconds: 2,
          minimumTotalTimeSeconds: 30,
          straightLiningThreshold: 0.8,
          autoAcceptThreshold: 80,
          autoRejectThreshold: 30,
        };
      case 'SENTIMENT_ANALYSIS':
        return {
          confidenceThreshold: 0.6,
          includeEmotions: true,
          extractKeywords: true,
          defaultLanguage: 'en',
        };
      case 'DROPOUT_PREDICTION':
        return {
          lowRiskThreshold: 0.25,
          mediumRiskThreshold: 0.5,
          highRiskThreshold: 0.75,
          enableInterventions: true,
        };
      default:
        return {};
    }
  },

  /**
   * Get or create Response Quality Detector instance
   */
  async getResponseQualityDetector(config: any): Promise<ResponseQualityDetector> {
    let detector = featureInstances.get(config.id) as ResponseQualityDetector;

    if (!detector) {
      detector = new ResponseQualityDetector(config.settings as any);

      // Initialize with provider if available
      if (config.provider && config.modelName) {
        const providerConfig = await aiToolsService.getConfig(config.providerId);
        if (providerConfig) {
          await detector.initializeWithProvider(
            {
              id: providerConfig.id,
              type: providerConfig.type,
              endpoint: providerConfig.endpoint,
              apiKey: providerConfig.apiKey,
              username: providerConfig.username,
              password: providerConfig.password,
              database: providerConfig.database,
              isEnabled: providerConfig.isEnabled,
            },
            config.modelName
          );
        }
      }

      featureInstances.set(config.id, detector);
    }

    return detector;
  },

  /**
   * Get or create Sentiment Analyzer instance
   */
  async getSentimentAnalyzer(config: any): Promise<SentimentAnalyzer> {
    let analyzer = featureInstances.get(config.id) as SentimentAnalyzer;

    if (!analyzer) {
      analyzer = new SentimentAnalyzer(config.settings as any);

      // Initialize with provider if available
      if (config.provider && config.modelName) {
        const providerConfig = await aiToolsService.getConfig(config.providerId);
        if (providerConfig) {
          await analyzer.initializeWithProvider(
            {
              id: providerConfig.id,
              type: providerConfig.type,
              endpoint: providerConfig.endpoint,
              apiKey: providerConfig.apiKey,
              username: providerConfig.username,
              password: providerConfig.password,
              database: providerConfig.database,
              isEnabled: providerConfig.isEnabled,
            },
            config.modelName
          );
        }
      }

      featureInstances.set(config.id, analyzer);
    }

    return analyzer;
  },

  /**
   * Get or create Dropout Predictor instance
   */
  async getDropoutPredictor(config: any): Promise<DropoutPredictor> {
    let predictor = featureInstances.get(config.id) as DropoutPredictor;

    if (!predictor) {
      predictor = new DropoutPredictor(config.settings as any);

      // Initialize with provider if available
      if (config.provider && config.modelName) {
        const providerConfig = await aiToolsService.getConfig(config.providerId);
        if (providerConfig) {
          await predictor.initializeWithProvider(
            {
              id: providerConfig.id,
              type: providerConfig.type,
              endpoint: providerConfig.endpoint,
              apiKey: providerConfig.apiKey,
              username: providerConfig.username,
              password: providerConfig.password,
              database: providerConfig.database,
              isEnabled: providerConfig.isEnabled,
            },
            config.modelName
          );
        }
      }

      featureInstances.set(config.id, predictor);
    }

    return predictor;
  },

  /**
   * Clear cached feature instances
   */
  clearCache() {
    featureInstances.clear();
    providerCache.clear();
  },
};
