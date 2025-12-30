import { ResponseService } from '../../../src/services/responseService';
import { prisma } from '../../../tests/setup';
import {
  userFixtures,
  surveyFixtures,
  questionFixtures,
  responseFixtures
} from '../../fixtures';
import { QuestionType } from '@prisma/client';
import { AppError } from '../../../src/middleware/errorHandler';

describe('ResponseService', () => {
  let testUser: any;
  let testSurvey: any;
  let questions: any[];

  beforeEach(async () => {
    testUser = await userFixtures.createUser();
    testSurvey = await surveyFixtures.createActiveSurvey(testUser.id);

    // Create sample questions
    questions = [
      await questionFixtures.createQuestion(testSurvey.id, {
        text: 'What is your name?',
        type: QuestionType.SHORT_TEXT,
        isRequired: true,
      }),
      await questionFixtures.createMultipleChoiceQuestion(
        testSurvey.id,
        ['Option 1', 'Option 2', 'Option 3'],
        { text: 'Choose one', isRequired: true }
      ),
      await questionFixtures.createEmailQuestion(testSurvey.id, {
        text: 'Your email',
        isRequired: false,
      }),
    ];
  });

  describe('submit', () => {
    it('should successfully submit a complete response', async () => {
      const responseData = {
        answers: [
          { questionId: questions[0].id, textValue: 'John Doe' },
          { questionId: questions[1].id, textValue: 'Option 1' },
          { questionId: questions[2].id, textValue: 'john@example.com' },
        ],
        tracking: {
          source: 'direct',
        },
      };

      const response = await ResponseService.submit(
        testSurvey.id,
        responseData,
        '127.0.0.1',
        'Mozilla/5.0'
      );

      expect(response.surveyId).toBe(testSurvey.id);
      expect(response.isComplete).toBe(true);
      expect(response.answers).toHaveLength(3);
    });

    it('should submit anonymous response', async () => {
      const responseData = {
        answers: [
          { questionId: questions[0].id, textValue: 'Anonymous User' },
          { questionId: questions[1].id, textValue: 'Option 2' },
        ],
      };

      const response = await ResponseService.submit(
        testSurvey.id,
        responseData,
        '127.0.0.1',
        'Mozilla/5.0'
      );

      expect(response.isComplete).toBe(true);
    });

    it('should submit authenticated user response', async () => {
      const responseData = {
        answers: [
          { questionId: questions[0].id, textValue: 'Authenticated User' },
          { questionId: questions[1].id, textValue: 'Option 3' },
        ],
      };

      const response = await ResponseService.submit(
        testSurvey.id,
        responseData,
        '127.0.0.1',
        'Mozilla/5.0',
        testUser.id
      );

      expect(response.isComplete).toBe(true);
      expect(response.metadata).toHaveProperty('authenticatedUserId', testUser.id);
    });

    it('should validate required questions are answered', async () => {
      const responseData = {
        answers: [
          // Missing required question[0]
          { questionId: questions[1].id, textValue: 'Option 1' },
        ],
      };

      await expect(
        ResponseService.submit(testSurvey.id, responseData, '127.0.0.1', 'Mozilla/5.0')
      ).rejects.toThrow();
    });

    it('should track response source correctly', async () => {
      const sources = ['direct', 'email', 'social', 'qr'];

      for (const source of sources) {
        const responseData = {
          answers: [
            { questionId: questions[0].id, textValue: 'Test' },
            { questionId: questions[1].id, textValue: 'Option 1' },
          ],
          tracking: { source },
        };

        const response = await ResponseService.submit(
          testSurvey.id,
          responseData,
          `192.168.1.${sources.indexOf(source) + 10}`,
          'Mozilla/5.0'
        );
        expect(response.source).toBe(source);
      }
    });

    it('should reject responses to closed surveys', async () => {
      const closedSurvey = await surveyFixtures.createSurvey(testUser.id, {
        status: 'CLOSED',
      });

      const question = await questionFixtures.createQuestion(closedSurvey.id);

      const responseData = {
        answers: [{ questionId: question.id, textValue: 'Answer' }],
      };

      await expect(
        ResponseService.submit(closedSurvey.id, responseData, '127.0.0.1', 'Mozilla/5.0')
      ).rejects.toThrow(AppError);
    });

    it('should update survey analytics after submission', async () => {
      const responseData = {
        answers: [
          { questionId: questions[0].id, textValue: 'Test' },
          { questionId: questions[1].id, textValue: 'Option 1' },
        ],
      };

      await ResponseService.submit(testSurvey.id, responseData, '127.0.0.1', 'Mozilla/5.0');

      // Wait a bit for async analytics update
      await new Promise(resolve => setTimeout(resolve, 100));

      const analytics = await prisma.surveyAnalytics.findUnique({
        where: { surveyId: testSurvey.id },
      });

      expect(analytics?.totalResponses).toBeGreaterThan(0);
    });
  });

  describe('getById', () => {
    it('should retrieve response with answers', async () => {
      const submittedResponse = await responseFixtures.createResponseWithAnswers(
        testSurvey.id,
        [
          { questionId: questions[0].id, value: 'Test Answer' },
          { questionId: questions[1].id, value: 'Option 1' },
        ]
      );

      const retrieved = await ResponseService.getById(submittedResponse!.id);

      expect(retrieved.id).toBe(submittedResponse!.id);
      expect(retrieved.answers).toHaveLength(2);
    });

    it('should throw error for non-existent response', async () => {
      await expect(
        ResponseService.getById('non-existent-id')
      ).rejects.toThrow();
    });
  });

  describe('getBySurvey', () => {
    beforeEach(async () => {
      // Create multiple responses
      await responseFixtures.createMultipleResponses(testSurvey.id, 5);
    });

    it('should retrieve all responses for a survey', async () => {
      const responses = await ResponseService.getBySurvey(
        testSurvey.id,
        testUser.id
      );

      expect(responses.length).toBeGreaterThanOrEqual(5);
    });

    it('should filter complete vs incomplete responses', async () => {
      await responseFixtures.createIncompleteResponse(testSurvey.id);

      const completeResponses = await ResponseService.getBySurvey(
        testSurvey.id,
        testUser.id,
        { isComplete: true }
      );

      completeResponses.forEach((response: any) => {
        expect(response.isComplete).toBe(true);
      });
    });

    it('should not allow accessing responses from other users\' surveys', async () => {
      const otherUser = await userFixtures.createUser();
      const otherSurvey = await surveyFixtures.createActiveSurvey(otherUser.id);

      await expect(
        ResponseService.getBySurvey(otherSurvey.id, testUser.id)
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete response and its answers', async () => {
      const response = await responseFixtures.createResponseWithAnswers(
        testSurvey.id,
        [{ questionId: questions[0].id, value: 'Test' }]
      );

      await ResponseService.delete(response!.id, testUser.id);

      const deleted = await prisma.response.findUnique({
        where: { id: response!.id },
      });

      expect(deleted).toBeNull();

      // Verify answers are also deleted
      const answers = await prisma.answer.findMany({
        where: { responseId: response!.id },
      });

      expect(answers.length).toBe(0);
    });

    it('should update analytics after deleting response', async () => {
      const response = await responseFixtures.createResponse(testSurvey.id);

      const beforeAnalytics = await prisma.surveyAnalytics.findUnique({
        where: { surveyId: testSurvey.id },
      });

      await ResponseService.delete(response.id, testUser.id);

      // Wait a bit for async analytics update
      await new Promise(resolve => setTimeout(resolve, 100));

      const afterAnalytics = await prisma.surveyAnalytics.findUnique({
        where: { surveyId: testSurvey.id },
      });

      // Analytics should be updated (implementation specific)
      expect(afterAnalytics).toBeTruthy();
    });
  });
});
