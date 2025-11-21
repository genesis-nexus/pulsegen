import { Router } from 'express';
import AIController from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All AI routes require authentication
router.post('/generate-survey', authenticate, AIController.generateSurvey);
router.post('/surveys/:surveyId/suggest-questions', authenticate, AIController.suggestQuestions);
router.post('/questions/:questionId/optimize', authenticate, AIController.optimizeQuestion);
router.post('/sentiment', authenticate, AIController.analyzeSentiment);
router.post('/surveys/:surveyId/report', authenticate, AIController.generateReport);

// New AI features
router.post('/surveys/:surveyId/health-check', authenticate, AIController.healthCheck);
router.post('/surveys/:surveyId/analyze', authenticate, AIController.analyzeSurvey);

export default router;
