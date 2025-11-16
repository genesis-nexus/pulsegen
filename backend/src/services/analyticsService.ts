import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import AIService from './aiService';
import { QuestionType } from '@prisma/client';

export class AnalyticsService {
  private static CACHE_TTL = 300; // 5 minutes

  static async getSummary(surveyId: string, userId: string) {
    // Check ownership
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey || survey.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    const cacheKey = `survey:${surveyId}:analytics:summary`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const analytics = await prisma.surveyAnalytics.findUnique({
      where: { surveyId },
    });

    if (!analytics) {
      throw new AppError(404, 'Analytics not found');
    }

    const result = {
      totalResponses: analytics.totalResponses,
      completeResponses: analytics.completeResponses,
      averageDuration: analytics.averageDuration,
      completionRate: analytics.completionRate,
      dropoffRate: analytics.dropoffRate,
      lastCalculated: analytics.lastCalculated,
    };

    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

    return result;
  }

  static async getQuestionAnalytics(
    surveyId: string,
    userId: string,
    questionId?: string
  ) {
    // Check ownership
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!survey || survey.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    const questions = questionId
      ? survey.questions.filter((q) => q.id === questionId)
      : survey.questions;

    const analytics = await Promise.all(
      questions.map(async (question) => {
        const cacheKey = `question:${question.id}:analytics`;
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }

        const answers = await prisma.answer.findMany({
          where: {
            questionId: question.id,
            response: { isComplete: true },
          },
          include: {
            option: true,
          },
        });

        let data;

        switch (question.type) {
          case QuestionType.MULTIPLE_CHOICE:
          case QuestionType.CHECKBOXES:
          case QuestionType.DROPDOWN:
            data = this.analyzeChoiceQuestion(question, answers);
            break;

          case QuestionType.RATING_SCALE:
          case QuestionType.SLIDER:
          case QuestionType.NPS:
            data = this.analyzeScaleQuestion(question, answers);
            break;

          case QuestionType.SHORT_TEXT:
          case QuestionType.LONG_TEXT:
            data = this.analyzeTextQuestion(question, answers);
            break;

          case QuestionType.NUMBER:
            data = this.analyzeNumberQuestion(question, answers);
            break;

          default:
            data = { totalResponses: answers.length };
        }

        const result = {
          questionId: question.id,
          questionText: question.text,
          questionType: question.type,
          ...data,
        };

        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

        return result;
      })
    );

    return analytics;
  }

  private static analyzeChoiceQuestion(question: any, answers: any[]) {
    const optionCounts: Record<string, number> = {};
    const optionLabels: Record<string, string> = {};

    question.options.forEach((opt: any) => {
      optionCounts[opt.id] = 0;
      optionLabels[opt.id] = opt.text;
    });

    answers.forEach((answer) => {
      if (answer.optionId) {
        optionCounts[answer.optionId] = (optionCounts[answer.optionId] || 0) + 1;
      }
    });

    const totalResponses = answers.length;
    const data = Object.entries(optionCounts).map(([optionId, count]) => ({
      optionId,
      optionText: optionLabels[optionId],
      count,
      percentage: totalResponses > 0 ? (count / totalResponses) * 100 : 0,
    }));

    return {
      totalResponses,
      distribution: data.sort((a, b) => b.count - a.count),
    };
  }

  private static analyzeScaleQuestion(question: any, answers: any[]) {
    const values = answers
      .filter((a) => a.numberValue !== null)
      .map((a) => a.numberValue);

    if (values.length === 0) {
      return { totalResponses: 0 };
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;

    const sorted = [...values].sort((a, b) => a - b);
    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    const distribution: Record<number, number> = {};
    values.forEach((val) => {
      distribution[val] = (distribution[val] || 0) + 1;
    });

    return {
      totalResponses: answers.length,
      average: Math.round(average * 100) / 100,
      median,
      min: Math.min(...values),
      max: Math.max(...values),
      distribution: Object.entries(distribution).map(([value, count]) => ({
        value: parseFloat(value),
        count,
        percentage: (count / values.length) * 100,
      })),
    };
  }

  private static analyzeTextQuestion(question: any, answers: any[]) {
    const texts = answers
      .filter((a) => a.textValue)
      .map((a) => a.textValue);

    return {
      totalResponses: answers.length,
      responses: texts.slice(0, 50), // First 50 responses
      wordCount: texts.reduce((acc, text) => acc + text.split(/\s+/).length, 0),
    };
  }

  private static analyzeNumberQuestion(question: any, answers: any[]) {
    const values = answers
      .filter((a) => a.numberValue !== null)
      .map((a) => a.numberValue);

    if (values.length === 0) {
      return { totalResponses: 0 };
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;

    return {
      totalResponses: answers.length,
      average: Math.round(average * 100) / 100,
      min: Math.min(...values),
      max: Math.max(...values),
      sum,
    };
  }

  static async getInsights(surveyId: string, userId: string, type?: string) {
    // Check ownership
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!survey || survey.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    // Check cache first
    const cacheKey = `survey:${surveyId}:insights:${type || 'all'}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get existing insights
    const existingInsights = await prisma.aiInsight.findMany({
      where: {
        surveyId,
        ...(type && { type }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // If we have recent insights (less than 1 hour old), return them
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (existingInsights.length > 0 && existingInsights[0].createdAt > oneHourAgo) {
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(existingInsights));
      return existingInsights;
    }

    // Generate new insights with AI
    const responses = await prisma.response.findMany({
      where: {
        surveyId,
        isComplete: true,
      },
      include: {
        answers: {
          include: {
            question: true,
            option: true,
          },
        },
      },
      take: 100, // Limit to 100 responses for AI analysis
    });

    if (responses.length === 0) {
      return [];
    }

    const aiAnalysis = await AIService.analyzeResponses({
      responses,
      questions: survey.questions,
      analysisType: type as any,
    });

    // Store insights
    const insights = await Promise.all(
      aiAnalysis.insights.map((insight: any) =>
        prisma.aiInsight.create({
          data: {
            surveyId,
            type: aiAnalysis.type,
            insight: insight.description,
            confidence: insight.confidence,
            metadata: {
              title: insight.title,
              supportingData: insight.supportingData,
            },
          },
        })
      )
    );

    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(insights));

    return insights;
  }

  static async getCrossTabulation(
    surveyId: string,
    userId: string,
    questionId1: string,
    questionId2: string
  ) {
    // Check ownership
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey || survey.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    // Get all complete responses
    const responses = await prisma.response.findMany({
      where: {
        surveyId,
        isComplete: true,
      },
      include: {
        answers: {
          where: {
            OR: [{ questionId: questionId1 }, { questionId: questionId2 }],
          },
          include: {
            option: true,
          },
        },
      },
    });

    // Build cross-tabulation
    const crosstab: Record<string, Record<string, number>> = {};

    responses.forEach((response) => {
      const answer1 = response.answers.find((a) => a.questionId === questionId1);
      const answer2 = response.answers.find((a) => a.questionId === questionId2);

      if (answer1 && answer2) {
        const key1 = answer1.option?.text || answer1.textValue || 'N/A';
        const key2 = answer2.option?.text || answer2.textValue || 'N/A';

        if (!crosstab[key1]) {
          crosstab[key1] = {};
        }

        crosstab[key1][key2] = (crosstab[key1][key2] || 0) + 1;
      }
    });

    return {
      questionId1,
      questionId2,
      crosstab,
    };
  }
}

export default AnalyticsService;
