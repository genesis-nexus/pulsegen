import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { redis } from '../config/redis';

interface SubmitResponseData {
  answers: Array<{
    questionId: string;
    optionId?: string;
    textValue?: string;
    numberValue?: number;
    dateValue?: string;
    fileUrl?: string;
    metadata?: any;
  }>;
  metadata?: any;
}

export class ResponseService {
  static async submit(
    surveyId: string,
    data: SubmitResponseData,
    ipAddress?: string,
    userAgent?: string
  ) {
    // Get survey
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!survey) {
      throw new AppError(404, 'Survey not found');
    }

    // Check if survey is active
    if (survey.status !== 'ACTIVE') {
      throw new AppError(400, 'Survey is not accepting responses');
    }

    // Check if survey is closed
    if (survey.closeDate && new Date(survey.closeDate) < new Date()) {
      throw new AppError(400, 'Survey is closed');
    }

    // Check response limit
    if (survey.responseLimit) {
      const responseCount = await prisma.response.count({
        where: { surveyId, isComplete: true },
      });

      if (responseCount >= survey.responseLimit) {
        throw new AppError(400, 'Survey has reached response limit');
      }
    }

    // Check for duplicate responses if not allowed
    if (!survey.allowMultiple && !survey.isAnonymous && ipAddress) {
      const existing = await prisma.response.findFirst({
        where: {
          surveyId,
          ipAddress,
          isComplete: true,
        },
      });

      if (existing) {
        throw new AppError(400, 'You have already submitted a response');
      }
    }

    // Validate required questions
    const requiredQuestions = survey.questions.filter((q) => q.isRequired);
    const answeredQuestionIds = new Set(data.answers.map((a) => a.questionId));

    for (const question of requiredQuestions) {
      if (!answeredQuestionIds.has(question.id)) {
        throw new AppError(400, `Required question not answered: ${question.text}`);
      }
    }

    // Create response
    const response = await prisma.response.create({
      data: {
        surveyId,
        ipAddress: survey.isAnonymous ? null : ipAddress,
        userAgent,
        metadata: data.metadata,
        isComplete: true,
        completedAt: new Date(),
      },
    });

    // Create answers
    await prisma.answer.createMany({
      data: data.answers.map((answer) => ({
        responseId: response.id,
        questionId: answer.questionId,
        optionId: answer.optionId,
        textValue: answer.textValue,
        numberValue: answer.numberValue,
        dateValue: answer.dateValue ? new Date(answer.dateValue) : null,
        fileUrl: answer.fileUrl,
        metadata: answer.metadata,
      })),
    });

    // Update analytics (async)
    this.updateAnalytics(surveyId).catch((error) => {
      console.error('Error updating analytics:', error);
    });

    // Invalidate cache
    await redis.del(`survey:${surveyId}:analytics`);

    return this.getById(response.id);
  }

  static async getById(responseId: string) {
    const response = await prisma.response.findUnique({
      where: { id: responseId },
      include: {
        answers: {
          include: {
            question: true,
            option: true,
          },
        },
      },
    });

    if (!response) {
      throw new AppError(404, 'Response not found');
    }

    return response;
  }

  static async getBySurvey(surveyId: string, userId: string, filters?: {
    isComplete?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    // Check ownership
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey || survey.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    const where: any = { surveyId };

    if (filters?.isComplete !== undefined) {
      where.isComplete = filters.isComplete;
    }

    if (filters?.startDate || filters?.endDate) {
      where.completedAt = {};
      if (filters.startDate) {
        where.completedAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.completedAt.lte = new Date(filters.endDate);
      }
    }

    const responses = await prisma.response.findMany({
      where,
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                text: true,
                type: true,
              },
            },
            option: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    return responses;
  }

  static async delete(responseId: string, userId: string) {
    const response = await prisma.response.findUnique({
      where: { id: responseId },
      include: { survey: true },
    });

    if (!response) {
      throw new AppError(404, 'Response not found');
    }

    if (response.survey.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    await prisma.response.delete({
      where: { id: responseId },
    });

    // Update analytics
    await this.updateAnalytics(response.surveyId);

    // Invalidate cache
    await redis.del(`survey:${response.surveyId}:analytics`);
  }

  private static async updateAnalytics(surveyId: string) {
    const [totalResponses, completeResponses, avgDuration] = await Promise.all([
      prisma.response.count({ where: { surveyId } }),
      prisma.response.count({ where: { surveyId, isComplete: true } }),
      prisma.response.aggregate({
        where: { surveyId, isComplete: true },
        _avg: { duration: true },
      }),
    ]);

    const completionRate = totalResponses > 0
      ? (completeResponses / totalResponses) * 100
      : 0;

    const dropoffRate = 100 - completionRate;

    await prisma.surveyAnalytics.update({
      where: { surveyId },
      data: {
        totalResponses,
        completeResponses,
        averageDuration: avgDuration._avg.duration,
        completionRate,
        dropoffRate,
        lastCalculated: new Date(),
      },
    });
  }
}

export default ResponseService;
