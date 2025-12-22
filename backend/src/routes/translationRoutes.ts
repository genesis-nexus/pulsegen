/**
 * AI-Powered Translation Routes
 * Automatic survey translation endpoints
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { translationService, SUPPORTED_LANGUAGES } from '../services/translationService';
import { prisma } from '../config/database';
import { z } from 'zod';

const router = Router();

// Validation schemas
const translateSurveySchema = z.object({
  targetLanguages: z.array(z.string()).min(1).max(12),
  options: z.object({
    preserveFormatting: z.boolean().optional(),
    contextHints: z.string().optional(),
    formality: z.enum(['formal', 'informal', 'neutral']).optional(),
  }).optional(),
});

const translateQuestionSchema = z.object({
  text: z.string().min(1),
  options: z.array(z.string()).optional().default([]),
  sourceLanguage: z.string().optional().default('en'),
  targetLanguage: z.string().min(2),
});

const getSuggestionsSchema = z.object({
  text: z.string().min(1),
  targetLanguage: z.string().min(2),
  context: z.string().optional().default('survey question'),
});

const reviewTranslationSchema = z.object({
  original: z.string().min(1),
  translation: z.string().min(1),
  targetLanguage: z.string().min(2),
});

// Get supported languages
router.get('/languages', (_req, res) => {
  const languages = Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
    code,
    ...info,
  }));
  res.json(languages);
});

// Translate entire survey with AI
router.post('/surveys/:surveyId/translate', authenticate, async (req: AuthRequest, res: Response) => {
  const validation = translateSurveySchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors[0].message });
  }

  const { surveyId } = req.params;
  const { targetLanguages, options } = validation.data;

  try {
    // Verify survey ownership
    const survey = await prisma.survey.findFirst({
      where: {
        id: surveyId,
        createdBy: req.user!.id,
      },
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or access denied' });
    }

    const results = await translationService.translateSurvey(
      {
        surveyId,
        targetLanguages,
        options,
      },
      req.user!.id
    );

    res.json({ translations: results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get translation status for a survey
router.get('/surveys/:surveyId/translation-status', authenticate, async (req: AuthRequest, res: Response) => {
  const { surveyId } = req.params;

  try {
    const status = await translationService.getTranslationStatus(surveyId);
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Translate single question (for real-time editing)
router.post('/translate/question', authenticate, async (req: AuthRequest, res: Response) => {
  const validation = translateQuestionSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors[0].message });
  }

  const { text, options, sourceLanguage, targetLanguage } = validation.data;

  try {
    const result = await translationService.translateQuestion(
      text,
      options,
      sourceLanguage,
      targetLanguage,
      req.user!.id
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get translation suggestions
router.post('/translate/suggestions', authenticate, async (req: AuthRequest, res: Response) => {
  const validation = getSuggestionsSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors[0].message });
  }

  const { text, targetLanguage, context } = validation.data;

  try {
    const suggestions = await translationService.getSuggestions(
      text,
      targetLanguage,
      context,
      req.user!.id
    );

    res.json({ suggestions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Review translation quality
router.post('/translate/review', authenticate, async (req: AuthRequest, res: Response) => {
  const validation = reviewTranslationSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors[0].message });
  }

  const { original, translation, targetLanguage } = validation.data;

  try {
    const review = await translationService.reviewTranslation(
      original,
      translation,
      targetLanguage,
      req.user!.id
    );

    res.json(review);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all translations for a survey
router.get('/surveys/:surveyId/translations', authenticate, async (req: AuthRequest, res: Response) => {
  const { surveyId } = req.params;

  try {
    const translations = await prisma.surveyTranslation.findMany({
      where: { surveyId },
      select: {
        id: true,
        language: true,
        title: true,
        description: true,
        welcomeText: true,
        thankYouText: true,
        updatedAt: true,
      },
    });

    res.json({ translations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get translation for a specific language
router.get('/surveys/:surveyId/translations/:language', authenticate, async (req: AuthRequest, res: Response) => {
  const { surveyId, language } = req.params;

  try {
    const surveyTranslation = await prisma.surveyTranslation.findUnique({
      where: { surveyId_language: { surveyId, language } },
    });

    // Get question translations
    const questionTranslations = await prisma.questionTranslation.findMany({
      where: {
        question: { surveyId },
        language,
      },
      include: {
        question: {
          select: {
            id: true,
            text: true,
            options: {
              select: { id: true, text: true },
            },
          },
        },
      },
    });

    // Get option translations
    const optionTranslations = await prisma.questionOptionTranslation.findMany({
      where: {
        option: {
          question: { surveyId },
        },
        language,
      },
    });

    res.json({
      survey: surveyTranslation,
      questions: questionTranslations,
      options: optionTranslations,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a specific translation manually
router.put('/surveys/:surveyId/translations/:language', authenticate, async (req: AuthRequest, res: Response) => {
  const { surveyId, language } = req.params;
  const { title, description, welcomeText, thankYouText } = req.body;

  try {
    const translation = await prisma.surveyTranslation.upsert({
      where: { surveyId_language: { surveyId, language } },
      create: {
        surveyId,
        language,
        title,
        description,
        welcomeText,
        thankYouText,
      },
      update: {
        title,
        description,
        welcomeText,
        thankYouText,
      },
    });

    res.json(translation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a translation
router.delete('/surveys/:surveyId/translations/:language', authenticate, async (req: AuthRequest, res: Response) => {
  const { surveyId, language } = req.params;

  try {
    // Delete survey translation
    await prisma.surveyTranslation.delete({
      where: { surveyId_language: { surveyId, language } },
    });

    // Delete question translations
    await prisma.questionTranslation.deleteMany({
      where: {
        question: { surveyId },
        language,
      },
    });

    // Delete option translations
    await prisma.questionOptionTranslation.deleteMany({
      where: {
        option: {
          question: { surveyId },
        },
        language,
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
