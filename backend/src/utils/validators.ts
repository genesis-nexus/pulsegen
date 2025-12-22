import { z } from 'zod';
import { QuestionType, LogicType } from '@prisma/client';

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
  showProgressBar: z.boolean().optional(),
  progressBarPosition: z.string().optional(),
  progressBarStyle: z.string().optional(),
  progressBarFormat: z.string().optional(),
  paginationMode: z.string().optional(),
  questionsPerPage: z.number().int().positive().optional(),
});

export const updateSurveySchema = createSurveySchema.partial();

export const publishSurveySchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'CLOSED']),
});

// Question validators
// Logic validator
const logicSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['SKIP_LOGIC', 'BRANCHING', 'PIPING', 'DISPLAY_LOGIC']),
  targetQuestionId: z.string().optional(),
  conditions: z.array(z.any()),
  actions: z.array(z.any()),
});

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
  logic: z.array(logicSchema).optional(),
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

// Survey Logic validators
export const createLogicSchema = z.object({
  sourceQuestionId: z.string(),
  targetQuestionId: z.string().optional(),
  type: z.nativeEnum(LogicType),
  conditions: z.array(
    z.object({
      questionId: z.string(),
      operator: z.enum([
        'EQUALS',
        'NOT_EQUALS',
        'CONTAINS',
        'NOT_CONTAINS',
        'GREATER_THAN',
        'LESS_THAN',
        'IS_ANSWERED',
        'IS_NOT_ANSWERED',
      ]),
      value: z.union([z.string(), z.number(), z.array(z.string())]).optional(),
    })
  ),
  actions: z.object({
    action: z.enum(['SKIP_TO_QUESTION', 'SKIP_TO_END', 'SHOW_QUESTION', 'HIDE_QUESTION']),
    targetQuestionId: z.string().optional(),
  }),
});

export const updateLogicSchema = createLogicSchema.partial();
