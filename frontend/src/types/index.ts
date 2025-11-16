export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
}

export enum SurveyStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  CHECKBOXES = 'CHECKBOXES',
  DROPDOWN = 'DROPDOWN',
  RATING_SCALE = 'RATING_SCALE',
  MATRIX = 'MATRIX',
  RANKING = 'RANKING',
  SHORT_TEXT = 'SHORT_TEXT',
  LONG_TEXT = 'LONG_TEXT',
  EMAIL = 'EMAIL',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  TIME = 'TIME',
  FILE_UPLOAD = 'FILE_UPLOAD',
  SLIDER = 'SLIDER',
  YES_NO = 'YES_NO',
  NPS = 'NPS',
  LIKERT_SCALE = 'LIKERT_SCALE',
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  createdAt: string;
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  status: SurveyStatus;
  slug: string;
  isAnonymous: boolean;
  isPublic: boolean;
  allowMultiple: boolean;
  responseLimit?: number;
  closeDate?: string;
  welcomeText?: string;
  thankYouText?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  questions: Question[];
  theme?: SurveyTheme;
  _count?: {
    questions: number;
    responses: number;
  };
}

export interface Question {
  id: string;
  surveyId: string;
  type: QuestionType;
  text: string;
  description?: string;
  order: number;
  isRequired: boolean;
  isRandomized: boolean;
  settings?: Record<string, any>;
  validation?: Record<string, any>;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  questionId: string;
  text: string;
  value: string;
  order: number;
  imageUrl?: string;
}

export interface SurveyTheme {
  id: string;
  surveyId: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  logoUrl?: string;
  customCss?: string;
}

export interface Response {
  id: string;
  surveyId: string;
  isComplete: boolean;
  completedAt?: string;
  answers: Answer[];
}

export interface Answer {
  id: string;
  responseId: string;
  questionId: string;
  optionId?: string;
  textValue?: string;
  numberValue?: number;
  dateValue?: string;
  fileUrl?: string;
}

export interface Analytics {
  totalResponses: number;
  completeResponses: number;
  averageDuration?: number;
  completionRate?: number;
  dropoffRate?: number;
}

export interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  totalResponses: number;
  distribution?: Array<{
    optionId?: string;
    optionText?: string;
    value?: number;
    count: number;
    percentage: number;
  }>;
  average?: number;
  median?: number;
  min?: number;
  max?: number;
}

export interface AIInsight {
  id: string;
  surveyId: string;
  type: string;
  insight: string;
  confidence?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}
