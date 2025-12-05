/**
 * ML Features Routes
 *
 * API routes for ML-powered features
 */

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import * as mlFeaturesController from '../controllers/mlFeaturesController';

const router = Router();

// ============================================================================
// FEATURE CONFIGURATION (Admin only)
// ============================================================================

// Get all feature configurations
router.get('/configs', requireAuth, requireAdmin, mlFeaturesController.getAllFeatureConfigs);

// Get configurations by type
router.get(
  '/configs/type/:type',
  requireAuth,
  requireAdmin,
  mlFeaturesController.getFeatureConfigsByType
);

// Get default settings for a feature type
router.get(
  '/configs/defaults/:type',
  requireAuth,
  requireAdmin,
  mlFeaturesController.getDefaultSettings
);

// Get single configuration
router.get('/configs/:id', requireAuth, requireAdmin, mlFeaturesController.getFeatureConfig);

// Create configuration
router.post('/configs', requireAuth, requireAdmin, mlFeaturesController.createFeatureConfig);

// Update configuration
router.put('/configs/:id', requireAuth, requireAdmin, mlFeaturesController.updateFeatureConfig);

// Delete configuration
router.delete('/configs/:id', requireAuth, requireAdmin, mlFeaturesController.deleteFeatureConfig);

// Toggle feature enabled state
router.patch('/configs/:id/toggle', requireAuth, requireAdmin, mlFeaturesController.toggleFeature);

// ============================================================================
// SURVEY OVERRIDES
// ============================================================================

// Set survey-specific override
router.post(
  '/configs/:id/overrides',
  requireAuth,
  mlFeaturesController.setSurveyOverride
);

// Delete survey override
router.delete(
  '/configs/:id/overrides/:surveyId',
  requireAuth,
  mlFeaturesController.deleteSurveyOverride
);

// ============================================================================
// RESPONSE QUALITY
// ============================================================================

// Analyze response quality
router.post('/quality/analyze', requireAuth, mlFeaturesController.analyzeResponseQuality);

// Get quality statistics for a survey
router.get('/quality/stats/:surveyId', requireAuth, mlFeaturesController.getQualityStats);

// ============================================================================
// SENTIMENT ANALYSIS
// ============================================================================

// Analyze single text sentiment
router.post('/sentiment/analyze', requireAuth, mlFeaturesController.analyzeSentiment);

// Analyze batch sentiments
router.post('/sentiment/analyze/batch', requireAuth, mlFeaturesController.analyzeSentimentBatch);

// Get sentiment statistics for a survey
router.get('/sentiment/stats/:surveyId', requireAuth, mlFeaturesController.getSentimentStats);

// ============================================================================
// DROPOUT PREDICTION
// ============================================================================

// Predict dropout probability
router.post('/dropout/predict', requireAuth, mlFeaturesController.predictDropout);

// Mark intervention as shown
router.patch(
  '/dropout/intervention/:predictionId',
  requireAuth,
  mlFeaturesController.markInterventionShown
);

// Get dropout statistics for a survey
router.get('/dropout/stats/:surveyId', requireAuth, mlFeaturesController.getDropoutStats);

// ============================================================================
// ADMINISTRATION
// ============================================================================

// Clear feature instance cache
router.post('/cache/clear', requireAuth, requireAdmin, mlFeaturesController.clearCache);

export default router;
