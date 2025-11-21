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

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}
