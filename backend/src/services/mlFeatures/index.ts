/**
 * ML Features Module
 *
 * Exports all ML-powered features for survey analysis:
 * - Response Quality Detection
 * - Sentiment Analysis
 * - Dropout Prediction
 */

// Main service
export { mlFeaturesService } from './mlFeaturesService';

// Individual feature classes
export {
  ResponseQualityDetector,
  responseQualityDetector,
  ResponseQualitySettings,
} from './responseQualityDetector';

export {
  SentimentAnalyzer,
  sentimentAnalyzer,
  SentimentAnalysisSettings,
} from './sentimentAnalyzer';

export {
  DropoutPredictor,
  dropoutPredictor,
  DropoutPredictionSettings,
} from './dropoutPredictor';
