import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { quotaService } from '../services/quotaService';
import { prisma } from '../config/database';
import { z } from 'zod';

const router = Router();

// Get quotas for a survey (authenticated)
router.get('/surveys/:surveyId/quotas', authenticate, async (req, res) => {
  try {
    const status = await quotaService.getQuotaStatus(req.params.surveyId);
    res.json(status);
  } catch (error) {
    console.error('Error fetching quotas:', error);
    res.status(500).json({ error: 'Failed to fetch quotas' });
  }
});

// Create quota
router.post('/surveys/:surveyId/quotas', authenticate, async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    limit: z.number().min(1),
    action: z.enum(['END_SURVEY', 'REDIRECT', 'HIDE_QUESTIONS', 'CONTINUE']),
    actionMessage: z.string().optional(),
    actionUrl: z.string().url().optional(),
    alertEmails: z.array(z.string().email()).optional(),
    conditions: z.array(z.object({
      questionId: z.string(),
      operator: z.enum(['EQUALS', 'NOT_EQUALS', 'IN', 'NOT_IN', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'CONTAINS']),
      value: z.string(),
      values: z.array(z.string()).optional(),
    })).min(1),
  });

  try {
    const data = schema.parse(req.body);
    const quota = await quotaService.createQuota(req.params.surveyId, data);
    res.status(201).json(quota);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid quota configuration', details: error.errors });
    } else {
      console.error('Error creating quota:', error);
      res.status(500).json({ error: 'Failed to create quota' });
    }
  }
});

// Update quota
router.put('/quotas/:quotaId', authenticate, async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    limit: z.number().min(1).optional(),
    action: z.enum(['END_SURVEY', 'REDIRECT', 'HIDE_QUESTIONS', 'CONTINUE']).optional(),
    actionMessage: z.string().optional(),
    actionUrl: z.string().url().optional(),
    alertEmails: z.array(z.string().email()).optional(),
    isActive: z.boolean().optional(),
  });

  try {
    const data = schema.parse(req.body);
    const quota = await quotaService.updateQuota(req.params.quotaId, data);
    res.json(quota);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid quota data', details: error.errors });
    } else {
      console.error('Error updating quota:', error);
      res.status(500).json({ error: 'Failed to update quota' });
    }
  }
});

// Delete quota
router.delete('/quotas/:quotaId', authenticate, async (req, res) => {
  try {
    await quotaService.deleteQuota(req.params.quotaId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting quota:', error);
    res.status(500).json({ error: 'Failed to delete quota' });
  }
});

// Toggle quota active state
router.patch('/quotas/:quotaId/toggle', authenticate, async (req, res) => {
  try {
    const updated = await quotaService.toggleQuota(req.params.quotaId);
    res.json(updated);
  } catch (error) {
    console.error('Error toggling quota:', error);
    res.status(500).json({ error: 'Failed to toggle quota' });
  }
});

// Create interlocked quotas (matrix-style)
router.post('/surveys/:surveyId/quotas/interlocked', authenticate, async (req, res) => {
  const schema = z.object({
    name: z.string(),
    question1Id: z.string(),
    question1Values: z.array(z.string()),
    question2Id: z.string(),
    question2Values: z.array(z.string()),
    limits: z.record(z.record(z.number())),
    action: z.enum(['END_SURVEY', 'REDIRECT', 'HIDE_QUESTIONS', 'CONTINUE']),
  });

  try {
    const data = schema.parse(req.body);
    await quotaService.createInterlockedQuotas(req.params.surveyId, data);
    res.status(201).json({ success: true });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid configuration', details: error.errors });
    } else {
      console.error('Error creating interlocked quotas:', error);
      res.status(500).json({ error: 'Failed to create interlocked quotas' });
    }
  }
});

// Check quotas (public - for survey taking)
// This endpoint is used by the frontend to check if a response matches any quotas
router.post('/surveys/:surveyId/quotas/check', async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Invalid answers format' });
    }

    const result = await quotaService.checkQuotas(req.params.surveyId, answers);
    res.json(result);
  } catch (error) {
    console.error('Error checking quotas:', error);
    res.status(500).json({ error: 'Failed to check quotas' });
  }
});

// Reset quota count (for testing/admin purposes)
router.post('/quotas/:quotaId/reset', authenticate, async (req, res) => {
  try {
    const quota = await prisma.quota.update({
      where: { id: req.params.quotaId },
      data: { currentCount: 0 },
    });

    // Optionally, delete associated QuotaResponse records
    await prisma.quotaResponse.deleteMany({
      where: { quotaId: req.params.quotaId },
    });

    res.json(quota);
  } catch (error) {
    console.error('Error resetting quota:', error);
    res.status(500).json({ error: 'Failed to reset quota' });
  }
});

export default router;
