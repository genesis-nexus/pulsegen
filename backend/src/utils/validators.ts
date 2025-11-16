import { z } from 'zod';
import { QuestionType, SurveyStatus, LogicType } from '@prisma/client';

// Auth validators
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Survey validators
export const createSurveySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  workspaceId: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  allowMultiple: z.boolean().optional(),
  responseLimit: z.number().int().positive().optional(),
  closeDate: z.string().datetime().optional(),
  welcomeText: z.string().optional(),
  thankYouText: z.string().optional(),
});

export const updateSurveySchema = createSurveySchema.partial();

export const publishSurveySchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'CLOSED']),
});

// Question validators
export const createQuestionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  text: z.string().min(1, 'Question text is required'),
  description: z.string().optional(),
  pageId: z.string().optional(),
  isRequired: z.boolean().optional(),
  isRandomized: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
  validation: z.record(z.any()).optional(),
  options: z
    .array(
      z.object({
        text: z.string(),
        value: z.string(),
        imageUrl: z.string().optional(),
      })
    )
    .optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

// Response validators
export const submitResponseSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      optionId: z.string().optional(),
      textValue: z.string().optional(),
      numberValue: z.number().optional(),
      dateValue: z.string().datetime().optional(),
      fileUrl: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    })
  ),
  metadata: z.record(z.any()).optional(),
});

// Workspace validators
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
});

export const addWorkspaceMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['ADMIN', 'MANAGER', 'VIEWER']),
});

// Theme validators
export const updateThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  fontFamily: z.string(),
  logoUrl: z.string().url().optional(),
  customCss: z.string().optional(),
});

// AI validators
export const generateSurveySchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  questionCount: z.number().int().min(1).max(50).optional(),
  includeLogic: z.boolean().optional(),
});

export const analyzeResponsesSchema = z.object({
  surveyId: z.string(),
  analysisType: z
    .enum(['summary', 'sentiment', 'themes', 'recommendations'])
    .optional(),
});

// Export validators
export const createExportSchema = z.object({
  format: z.enum(['CSV', 'EXCEL', 'PDF', 'JSON']),
  filters: z.record(z.any()).optional(),
});
