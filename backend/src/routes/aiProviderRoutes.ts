import { Router } from 'express';
import AIProviderController from '../controllers/aiProviderController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All AI provider routes require authentication
router.get('/providers/available', authenticate, AIProviderController.getAvailableProviders);
router.get('/providers', authenticate, AIProviderController.listProviders);
router.post('/providers', authenticate, AIProviderController.addProvider);
router.put('/providers/:provider', authenticate, AIProviderController.updateProvider);
router.delete('/providers/:provider', authenticate, AIProviderController.deleteProvider);

export default router;
