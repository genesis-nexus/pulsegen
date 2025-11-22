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

// AI Usage tracking
router.get('/usage', authenticate, AIController.getUsageStats);
router.get('/usage/monthly', authenticate, AIController.getMonthlyUsage);
router.get('/usage/logs', authenticate, AIController.getUsageLogs);

// AI Chat
router.get('/chat/conversations', authenticate, AIController.getConversations);
router.post('/chat/conversations', authenticate, AIController.createConversation);
router.get('/chat/conversations/:conversationId', authenticate, AIController.getConversation);
router.post('/chat/conversations/:conversationId/messages', authenticate, AIController.sendMessage);
router.delete('/chat/conversations/:conversationId', authenticate, AIController.deleteConversation);

export default router;
