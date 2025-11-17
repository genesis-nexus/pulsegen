import { Router } from 'express';
import { aiToolsController } from '../controllers/aiToolsController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All AI tools routes require admin access
router.use(authenticate, requireAdmin);

// Get all configured AI tools
router.get('/tools', aiToolsController.getAll);

// Get available AI tool types
router.get('/tools/available', aiToolsController.getAvailableTools);

// Get specific AI tool config
router.get('/tools/:id', aiToolsController.getOne);

// Create new AI tool config
router.post('/tools', aiToolsController.create);

// Update AI tool config
router.put('/tools/:id', aiToolsController.update);

// Delete AI tool config
router.delete('/tools/:id', aiToolsController.delete);

// Test AI tool connection
router.post('/tools/:id/test', aiToolsController.testConnection);

export default router;
