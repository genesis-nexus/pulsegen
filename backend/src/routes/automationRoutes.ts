/**
 * Automation Routes
 * API endpoints for the automation tool
 */

import { Router, Request, Response } from 'express';
import { AutomationService } from '../services/automationService';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const automationConfigSchema = z.object({
  personaId: z.string(),
  surveyTitle: z.string().optional(),
  questionCount: z.number().min(1).max(50).optional(),
  useAI: z.boolean().optional(),
  includeLogic: z.boolean().optional(),
  scenarioCount: z.number().min(1).max(100).optional().default(20)
});

/**
 * GET /api/automation/personas
 * Get all available personas
 */
router.get('/personas', authenticate, async (req: Request, res: Response) => {
  try {
    const personas = await AutomationService.getPersonas();
    res.json(personas);
  } catch (error: any) {
    console.error('Error fetching personas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/automation/personas/:id
 * Get a specific persona by ID
 */
router.get('/personas/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const persona = await AutomationService.getPersona(id);
    res.json(persona);
  } catch (error: any) {
    console.error('Error fetching persona:', error);
    res.status(404).json({ error: error.message });
  }
});

/**
 * POST /api/automation/run
 * Run the full automation workflow
 */
router.post('/run', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Validate request body
    const validatedConfig = automationConfigSchema.parse(req.body);

    console.log('Starting automation with config:', validatedConfig);

    // Run automation
    const result = await AutomationService.runAutomation(userId, validatedConfig as any);

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Error running automation:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/automation/status/:surveyId
 * Get automation status for a survey
 */
router.get('/status/:surveyId', authenticate, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const status = await AutomationService.getAutomationStatus(surveyId);
    res.json(status);
  } catch (error: any) {
    console.error('Error fetching automation status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
