import { Router } from 'express';
import { identityProviderController } from '../controllers/identityProviderController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All identity provider routes require admin access
router.use(authenticate, requireAdmin);

// Get all configured providers
router.get('/providers', identityProviderController.getAll);

// Get available provider types
router.get('/providers/available', identityProviderController.getAvailable);

// Create new provider configuration
router.post('/providers', identityProviderController.create);

// Update provider configuration
router.put('/providers/:provider', identityProviderController.update);

// Delete provider configuration
router.delete('/providers/:provider', identityProviderController.delete);

// Toggle provider enabled status
router.patch('/providers/:provider/toggle', identityProviderController.toggleEnabled);

export default router;
