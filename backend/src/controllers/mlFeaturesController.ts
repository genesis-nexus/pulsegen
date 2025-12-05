/**
 * ML Features Controller
 *
 * API endpoints for ML-powered features:
 * - Feature configuration management
 * - Response quality analysis
 * - Sentiment analysis
 * - Dropout prediction
 */

import { Request, Response, NextFunction } from 'express';
import { mlFeaturesService } from '../services/mlFeatures';
import { ResponseQualityInput, SentimentInput, DropoutPredictionInput } from '../services/mlProviders/types';

// ============================================================================
// FEATURE CONFIGURATION
// ============================================================================

export const getAllFeatureConfigs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const configs = await mlFeaturesService.getAllFeatureConfigs();
    res.json({ success: true, data: configs });
  } catch (error) {
    next(error);
  }
};

export const getFeatureConfigsByType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.params;
    const validTypes = ['RESPONSE_QUALITY', 'SENTIMENT_ANALYSIS', 'DROPOUT_PREDICTION'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid feature type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const configs = await mlFeaturesService.getFeatureConfigsByType(type as any);
    res.json({ success: true, data: configs });
  } catch (error) {
    next(error);
  }
};

export const getFeatureConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const config = await mlFeaturesService.getFeatureConfig(id);
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

export const createFeatureConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    const config = await mlFeaturesService.createFeatureConfig(userId, req.body);
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

export const updateFeatureConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const config = await mlFeaturesService.updateFeatureConfig(id, req.body);
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

export const deleteFeatureConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await mlFeaturesService.deleteFeatureConfig(id);
    res.json({ success: true, message: 'Feature configuration deleted' });
  } catch (error) {
    next(error);
  }
};

export const toggleFeature = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { isEnabled } = req.body;

    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isEnabled must be a boolean',
      });
    }

    const config = await mlFeaturesService.toggleFeature(id, isEnabled);
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

export const getDefaultSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.params;
    const validTypes = ['RESPONSE_QUALITY', 'SENTIMENT_ANALYSIS', 'DROPOUT_PREDICTION'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid feature type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const settings = mlFeaturesService.getDefaultSettings(type as any);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// SURVEY OVERRIDES
// ============================================================================

export const setSurveyOverride = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const override = await mlFeaturesService.setSurveyOverride(id, req.body);
    res.json({ success: true, data: override });
  } catch (error) {
    next(error);
  }
};

export const deleteSurveyOverride = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, surveyId } = req.params;
    await mlFeaturesService.deleteSurveyOverride(id, surveyId);
    res.json({ success: true, message: 'Survey override deleted' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// RESPONSE QUALITY
// ============================================================================

export const analyzeResponseQuality = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { configId } = req.query;
    const input: ResponseQualityInput = req.body;

    // Validate required fields
    if (!input.responseId || !input.surveyId || !input.answers || !input.metadata) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: responseId, surveyId, answers, metadata',
      });
    }

    const result = await mlFeaturesService.analyzeResponseQuality(
      input,
      configId as string
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getQualityStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { surveyId } = req.params;
    const stats = await mlFeaturesService.getQualityStats(surveyId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// SENTIMENT ANALYSIS
// ============================================================================

export const analyzeSentiment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { configId, surveyId, answerId } = req.query;
    const input: SentimentInput = req.body;

    // Validate required fields
    if (!input.text) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: text',
      });
    }

    const result = await mlFeaturesService.analyzeSentiment(input, {
      configId: configId as string,
      surveyId: surveyId as string,
      answerId: answerId as string,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const analyzeSentimentBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { configId, surveyId } = req.query;
    const { texts } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'texts must be a non-empty array',
      });
    }

    const results = await mlFeaturesService.analyzeSentimentBatch(texts, {
      configId: configId as string,
      surveyId: surveyId as string,
    });
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

export const getSentimentStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { surveyId } = req.params;
    const stats = await mlFeaturesService.getSentimentStats(surveyId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// DROPOUT PREDICTION
// ============================================================================

export const predictDropout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { configId } = req.query;
    const input: DropoutPredictionInput = req.body;

    // Validate required fields
    const requiredFields = [
      'responseId',
      'surveyId',
      'currentPage',
      'totalPages',
      'questionsAnswered',
      'totalQuestions',
      'timeSpentSoFar',
      'deviceType',
      'hourOfDay',
      'dayOfWeek',
    ];

    const missingFields = requiredFields.filter(field => input[field as keyof DropoutPredictionInput] === undefined);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    const result = await mlFeaturesService.predictDropout(input, configId as string);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const markInterventionShown = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { predictionId } = req.params;
    await mlFeaturesService.markInterventionShown(predictionId);
    res.json({ success: true, message: 'Intervention marked as shown' });
  } catch (error) {
    next(error);
  }
};

export const getDropoutStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { surveyId } = req.params;
    const stats = await mlFeaturesService.getDropoutStats(surveyId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

export const clearCache = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    mlFeaturesService.clearCache();
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    next(error);
  }
};
