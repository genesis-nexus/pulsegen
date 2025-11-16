import { Router } from 'express';
import { surveySharingController } from '../controllers/surveySharingController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/share/:linkCode', surveySharingController.getSurveyByShareLink);
router.post('/surveys/:surveyId/check-access', surveySharingController.checkAccess);
router.post('/surveys/:surveyId/verify-password', surveySharingController.verifyPassword);

// Protected routes (require authentication)
router.use(authenticate);

router.put('/surveys/:surveyId/visibility', surveySharingController.updateVisibility);
router.post('/surveys/:surveyId/share-link', surveySharingController.generateShareableLink);
router.post('/surveys/:surveyId/qr-code', surveySharingController.generateQRCode);
router.post('/surveys/:surveyId/embed-code', surveySharingController.generateEmbedCode);

export default router;
