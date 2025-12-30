import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const responseFixtures = {
  /**
   * Create a response
   */
  createResponse: async (surveyId: string, overrides: any = {}) => {
    const defaultData = {
      surveyId,
      source: 'direct',
      isComplete: true,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Test Browser)',
    };

    return await prisma.response.create({
      data: { ...defaultData, ...overrides },
    });
  },

  /**
   * Create a response with answers
   */
  createResponseWithAnswers: async (surveyId: string, questionAnswerPairs: Array<{ questionId: string; value: any }>, overrides: any = {}) => {
    const response = await responseFixtures.createResponse(surveyId, overrides);

    for (const pair of questionAnswerPairs) {
      await prisma.answer.create({
        data: {
          responseId: response.id,
          questionId: pair.questionId,
          textValue: String(pair.value),
        },
      });
    }

    return await prisma.response.findUnique({
      where: { id: response.id },
      include: { answers: true },
    });
  },

  /**
   * Create an authenticated user response
   */
  createAuthenticatedResponse: async (surveyId: string, userId: string, overrides: any = {}) => {
    return await responseFixtures.createResponse(surveyId, {
      userId,
      ...overrides,
    });
  },

  /**
   * Create an incomplete response
   */
  createIncompleteResponse: async (surveyId: string, overrides: any = {}) => {
    return await responseFixtures.createResponse(surveyId, {
      isComplete: false,
      ...overrides,
    });
  },

  /**
   * Create multiple responses
   */
  createMultipleResponses: async (surveyId: string, count: number, overrides: any = {}) => {
    const responses = [];
    for (let i = 0; i < count; i++) {
      responses.push(await responseFixtures.createResponse(surveyId, {
        ...overrides,
        ipAddress: `192.168.1.${i + 1}`,
      }));
    }
    return responses;
  },

  /**
   * Create a response from different source
   */
  createResponseFromSource: async (surveyId: string, source: string, overrides: any = {}) => {
    return await responseFixtures.createResponse(surveyId, {
      source,
      ...overrides,
    });
  },
};

export default responseFixtures;
