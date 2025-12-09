import { Router } from 'express';
import AnalyticsController from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All analytics routes require authentication
router.get('/surveys/:surveyId', authenticate, AnalyticsController.getSummary); // Combined analytics endpoint
router.get('/surveys/:surveyId/summary', authenticate, AnalyticsController.getSummary);
router.get('/surveys/:surveyId/questions', authenticate, AnalyticsController.getQuestionAnalytics);
router.get('/surveys/:surveyId/insights', authenticate, AnalyticsController.getInsights);
router.get('/surveys/:surveyId/crosstab', authenticate, AnalyticsController.getCrossTabulation);

export default router;
