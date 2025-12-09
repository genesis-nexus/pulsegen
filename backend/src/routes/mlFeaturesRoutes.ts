/**
 * ML Features Routes
 *
 * API routes for ML-powered features
 */

import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as mlFeaturesController from '../controllers/mlFeaturesController';

const router = Router();

// ============================================================================
// FEATURE CONFIGURATION (Admin only)
// ============================================================================

// Get all feature configurations
router.get('/configs', authenticate, requireAdmin, mlFeaturesController.getAllFeatureConfigs);

// Get configurations by type
router.get(
  '/configs/type/:type',
  authenticate,
  requireAdmin,
  mlFeaturesController.getFeatureConfigsByType
);

// Get default settings for a feature type
router.get(
  '/configs/defaults/:type',
  authenticate,
  requireAdmin,
  mlFeaturesController.getDefaultSettings
);

// Get single configuration
router.get('/configs/:id', authenticate, requireAdmin, mlFeaturesController.getFeatureConfig);

// Create configuration
router.post('/configs', authenticate, requireAdmin, mlFeaturesController.createFeatureConfig);

// Update configuration
router.put('/configs/:id', authenticate, requireAdmin, mlFeaturesController.updateFeatureConfig);

// Delete configuration
router.delete('/configs/:id', authenticate, requireAdmin, mlFeaturesController.deleteFeatureConfig);

// Toggle feature enabled state
router.patch('/configs/:id/toggle', authenticate, requireAdmin, mlFeaturesController.toggleFeature);

// ============================================================================
// SURVEY OVERRIDES
// ============================================================================

// Set survey-specific override
router.post(
  '/configs/:id/overrides',
  authenticate,
  mlFeaturesController.setSurveyOverride
);

// Delete survey override
router.delete(
  '/configs/:id/overrides/:surveyId',
  authenticate,
  mlFeaturesController.deleteSurveyOverride
);

// ============================================================================
// RESPONSE QUALITY
// ============================================================================

// Analyze response quality
router.post('/quality/analyze', authenticate, mlFeaturesController.analyzeResponseQuality);

// Get quality statistics for a survey
router.get('/quality/stats/:surveyId', authenticate, mlFeaturesController.getQualityStats);

// ============================================================================
// SENTIMENT ANALYSIS
// ============================================================================

// Analyze single text sentiment
router.post('/sentiment/analyze', authenticate, mlFeaturesController.analyzeSentiment);

// Analyze batch sentiments
router.post('/sentiment/analyze/batch', authenticate, mlFeaturesController.analyzeSentimentBatch);

// Get sentiment statistics for a survey
router.get('/sentiment/stats/:surveyId', authenticate, mlFeaturesController.getSentimentStats);

// ============================================================================
// DROPOUT PREDICTION
// ============================================================================

// Predict dropout probability
router.post('/dropout/predict', authenticate, mlFeaturesController.predictDropout);

// Mark intervention as shown
router.patch(
  '/dropout/intervention/:predictionId',
  authenticate,
  mlFeaturesController.markInterventionShown
);

// Get dropout statistics for a survey
router.get('/dropout/stats/:surveyId', authenticate, mlFeaturesController.getDropoutStats);

// ============================================================================
// ADMINISTRATION
// ============================================================================

// Clear feature instance cache
router.post('/cache/clear', authenticate, requireAdmin, mlFeaturesController.clearCache);

export default router;
