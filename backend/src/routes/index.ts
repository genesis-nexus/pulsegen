import { Router } from 'express';
import authRoutes from './authRoutes';
import surveyRoutes from './surveyRoutes';
import responseRoutes from './responseRoutes';
import analyticsRoutes from './analyticsRoutes';
import aiRoutes from './aiRoutes';
import aiProviderRoutes from './aiProviderRoutes';
import aiToolsRoutes from './aiToolsRoutes';
import mlModelsRoutes from './mlModelsRoutes';
import identityProviderRoutes from './identityProviderRoutes';
import ssoRoutes from './ssoRoutes';
import smtpRoutes from './smtpRoutes';
import brandingRoutes from './brandingRoutes';
import surveySharingRoutes from './surveySharingRoutes';
import i18nRoutes from './i18nRoutes';
import userRoutes from './userRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/auth/sso', ssoRoutes); // SSO authentication
router.use('/users', userRoutes); // User management (Admin)
router.use('/surveys', surveyRoutes);
router.use('/responses', responseRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);
router.use('/ai', aiProviderRoutes); // AI provider management
router.use('/ai', aiToolsRoutes); // AI tools (MindsDB, etc.) configuration
router.use('/ml', mlModelsRoutes); // ML models and predictions
router.use('/identity', identityProviderRoutes); // Identity provider configuration
router.use('/settings', smtpRoutes); // SMTP configuration
router.use('/settings', brandingRoutes); // Platform branding
router.use('/i18n', i18nRoutes); // I18n and translations
router.use('/', surveySharingRoutes); // Survey sharing and visibility

export default router;
