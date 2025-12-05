import { Router } from 'express';
import authRoutes from './authRoutes';
import surveyRoutes from './surveyRoutes';
import responseRoutes from './responseRoutes';
import analyticsRoutes from './analyticsRoutes';
import aiRoutes from './aiRoutes';
import aiProviderRoutes from './aiProviderRoutes';
import aiToolsRoutes from './aiToolsRoutes';
import mlModelsRoutes from './mlModelsRoutes';
import mlFeaturesRoutes from './mlFeaturesRoutes';
import identityProviderRoutes from './identityProviderRoutes';
import ssoRoutes from './ssoRoutes';
import smtpRoutes from './smtpRoutes';
import brandingRoutes from './brandingRoutes';
import surveySharingRoutes from './surveySharingRoutes';
import automationRoutes from './automationRoutes';
import configRoutes from './config';
import downloadAccessRoutes from './downloadAccess';
import licenseRoutes from './license';
import platformRoutes from './platform';

const router = Router();

router.use('/auth', authRoutes);
router.use('/auth/sso', ssoRoutes); // SSO authentication
router.use('/surveys', surveyRoutes);
router.use('/responses', responseRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);
router.use('/ai', aiProviderRoutes); // AI provider management
router.use('/ai', aiToolsRoutes); // AI tools (MindsDB, etc.) configuration
router.use('/ml', mlModelsRoutes); // ML models and predictions
router.use('/ml/features', mlFeaturesRoutes); // ML-powered features (quality, sentiment, dropout)
router.use('/identity', identityProviderRoutes); // Identity provider configuration
router.use('/settings', smtpRoutes); // SMTP configuration
router.use('/settings', brandingRoutes); // Platform branding
router.use('/', surveySharingRoutes); // Survey sharing and visibility
router.use('/automation', automationRoutes); // Automation tool
router.use('/config', configRoutes); // Platform configuration
router.use('/download-access', downloadAccessRoutes); // Download access management
router.use('/license', licenseRoutes); // License validation
router.use('/platform', platformRoutes); // Platform settings

export default router;
