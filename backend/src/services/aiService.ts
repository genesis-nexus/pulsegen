import logger from '../utils/logger';
import { redis } from '../config/redis';
import { AIProviderService } from './aiProviderService';
import { AIProvider } from '@prisma/client';

interface GenerateSurveyOptions {
  userId: string;
  prompt: string;
  questionCount?: number;
  includeLogic?: boolean;
  provider?: AIProvider;
}

interface AnalyzeResponsesOptions {
  userId: string;
  responses: any[];
  questions: any[];
  analysisType?: 'summary' | 'sentiment' | 'themes' | 'recommendations';
  provider?: AIProvider;
}

export class AIService {
  private static CACHE_TTL = 3600; // 1 hour

  static async generateSurvey(options: GenerateSurveyOptions) {
    const cacheKey = `ai:survey:${options.userId}:${JSON.stringify(options.prompt)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const provider = await AIProviderService.getUserProvider(
        options.userId,
        options.provider
      );

      const result = await provider.generateSurvey({
        prompt: options.prompt,
        questionCount: options.questionCount,
        includeLogic: options.includeLogic,
      });

      if (result.success && result.data) {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result.data));
        return result.data;
      }

      throw new Error(result.error || 'Failed to generate survey');
    } catch (error: any) {
      logger.error('AI generateSurvey error:', error);
      throw error;
    }
  }

  static async suggestQuestions(
    userId: string,
    context: {
      surveyTitle: string;
      existingQuestions: string[];
      targetAudience?: string;
    },
    provider?: AIProvider
  ) {
    const cacheKey = `ai:questions:${userId}:${JSON.stringify(context)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const aiProvider = await AIProviderService.getUserProvider(userId, provider);

      const result = await aiProvider.suggestQuestions(context);

      if (result.success && result.data) {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result.data));
        return result.data;
      }

      throw new Error(result.error || 'Failed to suggest questions');
    } catch (error: any) {
      logger.error('AI suggestQuestions error:', error);
      throw error;
    }
  }

  static async analyzeResponses(options: AnalyzeResponsesOptions) {
    const cacheKey = `ai:analysis:${options.userId}:${JSON.stringify(options).substring(0, 100)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const provider = await AIProviderService.getUserProvider(
        options.userId,
        options.provider
      );

      const result = await provider.analyzeResponses({
        responses: options.responses,
        questions: options.questions,
        analysisType: options.analysisType,
      });

      if (result.success && result.data) {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result.data));
        return result.data;
      }

      throw new Error(result.error || 'Failed to analyze responses');
    } catch (error: any) {
      logger.error('AI analyzeResponses error:', error);
      throw error;
    }
  }

  static async analyzeSentiment(
    userId: string,
    text: string,
    provider?: AIProvider
  ): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    emotions?: string[];
  }> {
    const cacheKey = `ai:sentiment:${userId}:${text.substring(0, 100)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const aiProvider = await AIProviderService.getUserProvider(userId, provider);

      const result = await aiProvider.analyzeSentiment({ text });

      if (result.success && result.data) {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result.data));
        return result.data;
      }

      return { sentiment: 'neutral', score: 0.5 };
    } catch (error: any) {
      logger.error('AI sentiment analysis error:', error);
      return { sentiment: 'neutral', score: 0.5 };
    }
  }

  static async generateReport(
    userId: string,
    data: {
      surveyTitle: string;
      analytics: any;
      insights: any[];
    },
    provider?: AIProvider
  ): Promise<string> {
    try {
      const aiProvider = await AIProviderService.getUserProvider(userId, provider);

      const result = await aiProvider.generateReport(data);

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error(result.error || 'Failed to generate report');
    } catch (error: any) {
      logger.error('AI report generation error:', error);
      throw error;
    }
  }

  static async optimizeQuestion(
    userId: string,
    question: {
      text: string;
      type: string;
      options?: any[];
    },
    provider?: AIProvider
  ): Promise<{
    improvedText: string;
    suggestions: string[];
    improvedOptions?: any[];
  }> {
    try {
      const aiProvider = await AIProviderService.getUserProvider(userId, provider);

      const result = await aiProvider.optimizeQuestion(question);

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error(result.error || 'Failed to optimize question');
    } catch (error: any) {
      logger.error('AI question optimization error:', error);
      throw error;
    }
  }

  static async improveSurvey(
    userId: string,
    survey: {
      title: string;
      description?: string;
      questions: any[];
    },
    provider?: AIProvider
  ): Promise<any> {
    try {
      const aiProvider = await AIProviderService.getUserProvider(userId, provider);

      const result = await aiProvider.improveSurvey({ survey });

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error(result.error || 'Failed to improve survey');
    } catch (error: any) {
      logger.error('AI survey improvement error:', error);
      throw error;
    }
  }

  static async generateAnalyticsSummary(
    userId: string,
    data: {
      surveyTitle: string;
      analytics: any;
      timeRange?: string;
    },
    provider?: AIProvider
  ): Promise<any> {
    try {
      const aiProvider = await AIProviderService.getUserProvider(userId, provider);

      const result = await aiProvider.generateAnalyticsSummary(data);

      if (result.success && result.data) {
        return result.data;
      }

      throw new Error(result.error || 'Failed to generate analytics summary');
    } catch (error: any) {
      logger.error('AI analytics summary error:', error);
      throw error;
    }
  }
}

export default AIService;
