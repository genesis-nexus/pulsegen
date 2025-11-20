// Base interface for AI providers

export interface AIProviderConfig {
  apiKey: string;
  modelName?: string;
  endpoint?: string;
  settings?: Record<string, any>;
}

export interface GenerateSurveyRequest {
  prompt: string;
  questionCount?: number;
  includeLogic?: boolean;
}

export interface SuggestQuestionsRequest {
  surveyTitle: string;
  existingQuestions: string[];
  targetAudience?: string;
}

export interface AnalyzeResponsesRequest {
  responses: any[];
  questions: any[];
  analysisType?: 'summary' | 'sentiment' | 'themes' | 'recommendations';
}

export interface OptimizeQuestionRequest {
  text: string;
  type: string;
  options?: any[];
}

export interface SentimentAnalysisRequest {
  text: string;
}

export interface GenerateReportRequest {
  surveyTitle: string;
  analytics: any;
  insights: any[];
}

export interface GenerateSurveyIdeasRequest {
  topic: string;
  count?: number;
  targetAudience?: string;
  purpose?: string;
}

export interface ImproveSurveyRequest {
  survey: {
    title: string;
    description?: string;
    questions: any[];
  };
}

export interface GenerateAnalyticsSummaryRequest {
  surveyTitle: string;
  analytics: any;
  timeRange?: string;
}

export interface CrossSurveyAnalysisRequest {
  surveys: Array<{
    title: string;
    responses: any[];
    questions: any[];
  }>;
  analysisGoal?: string;
}

export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  provider: string;
  model?: string;
  tokensUsed?: number;
}

export abstract class BaseAIProvider {
  protected config: AIProviderConfig;
  protected providerName: string;

  constructor(config: AIProviderConfig, providerName: string) {
    this.config = config;
    this.providerName = providerName;
  }

  abstract generateSurvey(request: GenerateSurveyRequest): Promise<AIResponse>;
  abstract suggestQuestions(request: SuggestQuestionsRequest): Promise<AIResponse>;
  abstract analyzeResponses(request: AnalyzeResponsesRequest): Promise<AIResponse>;
  abstract optimizeQuestion(request: OptimizeQuestionRequest): Promise<AIResponse>;
  abstract analyzeSentiment(request: SentimentAnalysisRequest): Promise<AIResponse>;
  abstract generateReport(request: GenerateReportRequest): Promise<AIResponse>;

  // Enhanced AI features
  abstract generateSurveyIdeas(request: GenerateSurveyIdeasRequest): Promise<AIResponse>;
  abstract improveSurvey(request: ImproveSurveyRequest): Promise<AIResponse>;
  abstract generateAnalyticsSummary(request: GenerateAnalyticsSummaryRequest): Promise<AIResponse>;
  abstract crossSurveyAnalysis(request: CrossSurveyAnalysisRequest): Promise<AIResponse>;

  protected formatError(error: any): AIResponse {
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      provider: this.providerName,
    };
  }

  protected extractJSON(text: string): any {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  }
}
