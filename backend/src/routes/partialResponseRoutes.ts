import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { generateResumeCode, sendResumeEmail } from '../services/partialResponseService';
import { AppError } from '../middleware/errorHandler';
import { addDays } from 'date-fns';

const router = Router();

// Save partial response (create or update)
const savePartialSchema = z.object({
  surveyId: z.string(),
  answers: z.record(z.any()),
  currentPageIndex: z.number(),
  lastQuestionId: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  resumeToken: z.string().optional(), // If continuing existing partial
});

router.post('/save', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = savePartialSchema.parse(req.body);

    // Get survey settings
    const survey = await prisma.survey.findUnique({
      where: { id: data.surveyId },
      select: {
        id: true,
        title: true,
        allowSaveAndContinue: true,
        saveExpirationDays: true,
        requireEmailForSave: true,
      },
    });

    if (!survey) {
      throw new AppError(404, 'Survey not found');
    }

    if (!survey.allowSaveAndContinue) {
      throw new AppError(400, 'Save & Continue not enabled for this survey');
    }

    if (survey.requireEmailForSave && !data.email) {
      throw new AppError(400, 'Email is required to save progress');
    }

    const expiresAt = survey.saveExpirationDays > 0
      ? addDays(new Date(), survey.saveExpirationDays)
      : addDays(new Date(), 365 * 10); // 10 years if "never"

    let partialResponse;

    if (data.resumeToken) {
      // Update existing partial response
      partialResponse = await prisma.partialResponse.update({
        where: { resumeToken: data.resumeToken },
        data: {
          answers: data.answers,
          currentPageIndex: data.currentPageIndex,
          lastQuestionId: data.lastQuestionId,
          lastSavedAt: new Date(),
          respondentEmail: data.email,
          respondentName: data.name,
        },
      });
    } else {
      // Create new partial response
      const resumeCode = generateResumeCode(); // 6-char alphanumeric

      partialResponse = await prisma.partialResponse.create({
        data: {
          surveyId: data.surveyId,
          answers: data.answers,
          currentPageIndex: data.currentPageIndex,
          lastQuestionId: data.lastQuestionId,
          resumeCode,
          expiresAt,
          respondentEmail: data.email,
          respondentName: data.name,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    }

    // Generate resume URL
    const resumeUrl = `${process.env.APP_URL}/survey/${survey.id}/resume/${partialResponse.resumeToken}`;

    // Send email if provided
    if (data.email && !data.resumeToken) {
      await sendResumeEmail({
        email: data.email,
        name: data.name,
        resumeUrl,
        resumeCode: partialResponse.resumeCode!,
        surveyTitle: survey.title,
        expiresAt,
      });
    }

    res.json({
      success: true,
      resumeToken: partialResponse.resumeToken,
      resumeCode: partialResponse.resumeCode,
      resumeUrl,
      expiresAt: partialResponse.expiresAt,
    });
  } catch (error) {
    next(error);
  }
});

// Resume survey from token
router.get('/resume/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    const partialResponse = await prisma.partialResponse.findUnique({
      where: { resumeToken: token },
      include: {
        survey: {
          include: {
            pages: {
              include: {
                questions: {
                  include: { options: true },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
            questions: {
              include: { options: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!partialResponse) {
      throw new AppError(404, 'Resume link not found or expired');
    }

    if (partialResponse.status === 'EXPIRED' || partialResponse.expiresAt < new Date()) {
      await prisma.partialResponse.update({
        where: { id: partialResponse.id },
        data: { status: 'EXPIRED' },
      });
      throw new AppError(410, 'This save has expired. Please start a new survey.');
    }

    if (partialResponse.status === 'COMPLETED') {
      throw new AppError(400, 'This survey has already been completed.');
    }

    res.json({
      success: true,
      survey: partialResponse.survey,
      savedAnswers: partialResponse.answers,
      currentPageIndex: partialResponse.currentPageIndex,
      lastQuestionId: partialResponse.lastQuestionId,
      resumeToken: partialResponse.resumeToken,
      savedAt: partialResponse.lastSavedAt,
    });
  } catch (error) {
    next(error);
  }
});

// Resume from code (for manual entry)
router.post('/resume-by-code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { surveyId, code } = req.body;

    if (!surveyId || !code) {
      throw new AppError(400, 'Survey ID and code are required');
    }

    const partialResponse = await prisma.partialResponse.findFirst({
      where: {
        surveyId,
        resumeCode: code.toUpperCase(),
        status: 'IN_PROGRESS',
        expiresAt: { gt: new Date() },
      },
    });

    if (!partialResponse) {
      throw new AppError(404, 'Invalid code or session expired');
    }

    // Return token for redirect
    res.json({
      success: true,
      resumeToken: partialResponse.resumeToken,
      resumeUrl: `${process.env.APP_URL}/survey/${surveyId}/resume/${partialResponse.resumeToken}`,
    });
  } catch (error) {
    next(error);
  }
});

// Convert partial to complete response
router.post('/:token/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const { finalAnswers } = req.body;

    const partialResponse = await prisma.partialResponse.findUnique({
      where: { resumeToken: token },
      include: { survey: true },
    });

    if (!partialResponse || partialResponse.status !== 'IN_PROGRESS') {
      throw new AppError(404, 'Invalid or completed session');
    }

    // Create final response using existing response service logic
    const response = await prisma.$transaction(async (tx) => {
      // Create the completed response
      const newResponse = await tx.response.create({
        data: {
          surveyId: partialResponse.surveyId,
          ipAddress: partialResponse.ipAddress,
          userAgent: partialResponse.userAgent,
          isComplete: true,
          startedAt: partialResponse.startedAt,
          completedAt: new Date(),
          metadata: {
            resumedFrom: partialResponse.id,
            respondentEmail: partialResponse.respondentEmail,
            respondentName: partialResponse.respondentName,
          },
        },
      });

      // Create answers
      const answerEntries = Object.entries(finalAnswers);
      for (const [questionId, answerData] of answerEntries) {
        const data = answerData as any;
        await tx.answer.create({
          data: {
            responseId: newResponse.id,
            questionId,
            optionId: data.optionId || null,
            textValue: data.textValue || null,
            numberValue: data.numberValue || null,
            dateValue: data.dateValue ? new Date(data.dateValue) : null,
            fileUrl: data.fileUrl || null,
            metadata: data.metadata || null,
          },
        });
      }

      // Mark partial as completed
      await tx.partialResponse.update({
        where: { id: partialResponse.id },
        data: {
          status: 'COMPLETED',
          convertedToResponseId: newResponse.id,
        },
      });

      return newResponse;
    });

    res.json({
      success: true,
      responseId: response.id,
      message: 'Survey completed successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
