/**
 * AI Survey Wizard Routes
 * Conversational AI interface for building surveys
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { aiWizardService } from '../services/aiWizardService';
import { z } from 'zod';

const router = Router();

// Validation schemas
const messageSchema = z.object({
  message: z.string().min(1).max(5000),
});

const actionSchema = z.object({
  action: z.object({
    type: z.enum([
      'add_section',
      'remove_section',
      'add_question',
      'remove_question',
      'modify_question',
      'reorder_sections',
      'change_length',
    ]),
    payload: z.any(),
  }),
});

const finalizeSchema = z.object({
  workspaceId: z.string().optional(),
});

// Start new wizard conversation
router.post('/start', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const state = await aiWizardService.startConversation(req.user!.id);
    res.json({
      conversationId: state.conversationId,
      message: state.messages[state.messages.length - 1].content,
      currentStep: state.currentStep,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current wizard state
router.get('/state', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const state = await aiWizardService.getState(req.user!.id);
    if (!state) {
      return res.json({ active: false });
    }
    res.json({
      active: true,
      conversationId: state.conversationId,
      currentStep: state.currentStep,
      surveyDraft: state.surveyDraft,
      estimatedTime: state.surveyDraft
        ? aiWizardService.estimateCompletionTime(state.surveyDraft)
        : null,
      messageCount: state.messages.filter(m => m.role !== 'system').length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send message to wizard
router.post('/message', authenticate, async (req: AuthRequest, res: Response) => {
  const validation = messageSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors[0].message });
  }

  const { message } = validation.data;

  try {
    const result = await aiWizardService.processMessage(req.user!.id, message);

    res.json({
      response: result.response,
      surveyDraft: result.surveyDraft,
      currentStep: result.state.currentStep,
      estimatedTime: result.surveyDraft
        ? aiWizardService.estimateCompletionTime(result.surveyDraft)
        : null,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Apply action to draft
router.post('/action', authenticate, async (req: AuthRequest, res: Response) => {
  const validation = actionSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors[0].message });
  }

  const { action } = validation.data;

  try {
    const result = await aiWizardService.applyAction(req.user!.id, action as any);
    res.json({
      response: result.response,
      surveyDraft: result.surveyDraft,
      estimatedTime: result.surveyDraft
        ? aiWizardService.estimateCompletionTime(result.surveyDraft)
        : null,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get suggestions for current draft
router.get('/suggestions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const suggestions = await aiWizardService.getSuggestions(req.user!.id);
    res.json({ suggestions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Finalize and create survey
router.post('/finalize', authenticate, async (req: AuthRequest, res: Response) => {
  const validation = finalizeSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors[0].message });
  }

  const { workspaceId } = validation.data;

  try {
    const result = await aiWizardService.finalizeSurvey(req.user!.id, workspaceId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel/reset wizard
router.delete('/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const key = `wizard:${req.user!.id}`;
    const { redis } = await import('../config/redis');
    await redis.del(key);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
