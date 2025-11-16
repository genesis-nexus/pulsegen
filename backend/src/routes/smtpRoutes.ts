import { Router } from 'express';
import { smtpController } from '../controllers/smtpController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All SMTP routes require admin access
router.use(authenticate, requireAdmin);

// Get all SMTP configurations
router.get('/smtp', smtpController.getAll);

// Create new SMTP configuration
router.post('/smtp', smtpController.create);

// Update SMTP configuration
router.put('/smtp/:id', smtpController.update);

// Delete SMTP configuration
router.delete('/smtp/:id', smtpController.delete);

// Test SMTP connection
router.post('/smtp/:id/test', smtpController.testConnection);

// Send test email
router.post('/smtp/test-email', smtpController.sendTestEmail);

export default router;
