import { Router } from 'express';
import authRoutes from './authRoutes';
import surveyRoutes from './surveyRoutes';
import responseRoutes from './responseRoutes';
import analyticsRoutes from './analyticsRoutes';
import aiRoutes from './aiRoutes';
import aiProviderRoutes from './aiProviderRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/surveys', surveyRoutes);
router.use('/responses', responseRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);
router.use('/ai', aiProviderRoutes); // AI provider management

export default router;
