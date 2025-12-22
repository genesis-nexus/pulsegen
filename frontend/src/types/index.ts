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
  IMAGE_SELECT = 'IMAGE_SELECT',
  SEMANTIC_DIFFERENTIAL = 'SEMANTIC_DIFFERENTIAL',
  GEO_LOCATION = 'GEO_LOCATION',
  MULTIPLE_NUMERICAL = 'MULTIPLE_NUMERICAL',
  ARRAY_DUAL_SCALE = 'ARRAY_DUAL_SCALE',
  EQUATION = 'EQUATION',
  BOILERPLATE = 'BOILERPLATE',
  HIDDEN = 'HIDDEN',
  GENDER = 'GENDER',
  LANGUAGE_SWITCHER = 'LANGUAGE_SWITCHER',
  SIGNATURE = 'SIGNATURE',
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

  // Settings
  baseLanguage?: string;
  showProgressBar?: boolean;
  progressBarPosition?: 'top' | 'bottom' | 'both';
  progressBarStyle?: 'bar' | 'steps' | 'minimal' | 'combined';
  progressBarFormat?: 'percentage' | 'count' | 'both';

  // Pagination
  paginationMode?: 'all' | 'single' | 'custom';
  questionsPerPage?: number;

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
  logic?: SurveyLogic[];
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

export enum LogicType {
  SKIP_LOGIC = 'SKIP_LOGIC',
  BRANCHING = 'BRANCHING',
  PIPING = 'PIPING',
  DISPLAY_LOGIC = 'DISPLAY_LOGIC',
}

export enum ConditionOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  IS_ANSWERED = 'IS_ANSWERED',
  IS_NOT_ANSWERED = 'IS_NOT_ANSWERED',
}

export enum LogicAction {
  SKIP_TO_QUESTION = 'SKIP_TO_QUESTION',
  SKIP_TO_END = 'SKIP_TO_END',
  SHOW_QUESTION = 'SHOW_QUESTION',
  HIDE_QUESTION = 'HIDE_QUESTION',
}

export interface LogicCondition {
  questionId: string;
  operator: ConditionOperator;
  value?: string | number | string[] | boolean;
}

export interface LogicActionData {
  action: LogicAction;
  targetQuestionId?: string;
}

export interface SurveyLogic {
  id: string;
  surveyId: string;
  sourceQuestionId: string;
  targetQuestionId?: string;
  type: LogicType;
  conditions: LogicCondition[];
  actions: LogicActionData;
  createdAt?: string;
  updatedAt?: string;
}

// Automation Types
export interface PersonaAttribute {
  age: number;
  gender: string;
  occupation: string;
  experience: string;
  techSavviness: 'low' | 'medium' | 'high';
  educationLevel: string;
  location: string;
}

export interface IndustryPersona {
  id: string;
  industry: string;
  name: string;
  description: string;
  targetAudience: string;
  surveyTopics: string[];
  questionTypes: string[];
  typicalQuestions: string[];
  attributes: PersonaAttribute[];
  responsePatterns: {
    completionRate: number;
    averageTime: number;
    dropoffPoints: number[];
  };
}

export interface AutomationConfig {
  personaId: string;
  surveyTitle?: string;
  questionCount?: number;
  useAI?: boolean;
  includeLogic?: boolean;
  scenarioCount?: number;
}

export interface GeneratedSurvey {
  surveyId: string;
  slug: string;
  title: string;
  questionCount: number;
  url: string;
}

export interface SimulatedResponse {
  responseId: string;
  scenario: PersonaAttribute;
  completionTime: number;
  completed: boolean;
}

export interface AutomationResult {
  survey: GeneratedSurvey;
  responses: SimulatedResponse[];
  analytics: any;
  summary: {
    totalResponses: number;
    completedResponses: number;
    averageCompletionTime: number;
    completionRate: number;
  };
}

// Participant Management Types
export enum ParticipantStatus {
  PENDING = 'PENDING',
  INVITED = 'INVITED',
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  OPTED_OUT = 'OPTED_OUT',
  BOUNCED = 'BOUNCED',
  EXPIRED = 'EXPIRED',
}

export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  BOUNCED = 'BOUNCED',
  FAILED = 'FAILED',
}

export enum EmailTemplateType {
  INVITATION = 'INVITATION',
  REMINDER_1 = 'REMINDER_1',
  REMINDER_2 = 'REMINDER_2',
  REMINDER_3 = 'REMINDER_3',
  COMPLETION_THANK_YOU = 'COMPLETION_THANK_YOU',
  OPT_OUT_CONFIRMATION = 'OPT_OUT_CONFIRMATION',
}

export interface Participant {
  id: string;
  surveyId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  token: string;
  tokenUsed: boolean;
  status: ParticipantStatus;
  invitedAt?: string;
  startedAt?: string;
  completedAt?: string;
  attributes: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantStats {
  total: number;
  byStatus: Record<ParticipantStatus, number>;
  responseRate: number;
  averageTimeToComplete: number | null;
}

