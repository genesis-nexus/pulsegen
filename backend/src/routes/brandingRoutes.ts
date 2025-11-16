import { Router } from 'express';
import { brandingController } from '../controllers/brandingController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { uploadLogo, uploadFavicon, uploadBackground } from '../middleware/upload';

const router = Router();

// Public route to get branding
router.get('/branding', brandingController.get);

// Admin-only routes
router.use(authenticate, requireAdmin);

// Update branding settings
router.put('/branding', brandingController.update);

// Reset branding to defaults
router.post('/branding/reset', brandingController.reset);

// Upload branding images
router.post('/branding/upload/logo', uploadLogo, brandingController.uploadLogo);
router.post('/branding/upload/favicon', uploadFavicon, brandingController.uploadFavicon);
router.post('/branding/upload/background', uploadBackground, brandingController.uploadBackground);

// Delete branding images
router.delete('/branding/image/:type', brandingController.deleteImage);

export default router;
