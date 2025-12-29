import { Router } from 'express';
import ResponseController from '../controllers/responseController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Public response submission (with optional authentication)
router.post('/surveys/:surveyId/submit', optionalAuthenticate, ResponseController.submit);

// Protected routes
router.get('/:id', authenticate, ResponseController.getById);
router.get('/surveys/:surveyId', authenticate, ResponseController.getBySurvey);
router.delete('/:id', authenticate, ResponseController.delete);

export default router;
