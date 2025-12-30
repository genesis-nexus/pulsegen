import { quotaService } from '../../../src/services/quotaService';
import { prisma } from '../../../tests/setup';
import {
  userFixtures,
  surveyFixtures,
  questionFixtures,
  responseFixtures,
} from '../../fixtures';
import { QuestionType, QuotaAction, ConditionOperator } from '@prisma/client';

describe('QuotaService', () => {
  let testUser: any;
  let testSurvey: any;
  let question: any;

  beforeEach(async () => {
    testUser = await userFixtures.createUser();
    testSurvey = await surveyFixtures.createActiveSurvey(testUser.id, {
      quotasEnabled: true,
    });
    question = await questionFixtures.createMultipleChoiceQuestion(
      testSurvey.id,
      ['Option A', 'Option B', 'Option C'],
      { text: 'Which option do you prefer?', isRequired: true }
    );
  });

  describe('createQuota', () => {
    it('should create a quota with conditions', async () => {
      const quotaData = {
        name: 'Option A Quota',
        description: 'Limit responses for Option A',
        limit: 10,
        action: QuotaAction.END_SURVEY,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option A',
          },
        ],
      };

      const quota = await quotaService.createQuota(testSurvey.id, quotaData);

      expect(quota.name).toBe('Option A Quota');
      expect(quota.limit).toBe(10);
      expect(quota.currentCount).toBe(0);
      expect(quota.isActive).toBe(true);
      expect(quota.conditions).toHaveLength(1);
    });

    it('should create multiple quotas for different answers', async () => {
      const quota1 = await quotaService.createQuota(testSurvey.id, {
        name: 'Quota A',
        limit: 5,
        action: QuotaAction.END_SURVEY,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option A',
          },
        ],
      });

      const quota2 = await quotaService.createQuota(testSurvey.id, {
        name: 'Quota B',
        limit: 10,
        action: QuotaAction.END_SURVEY,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option B',
          },
        ],
      });

      expect(quota1.id).not.toBe(quota2.id);
      expect(quota1.name).not.toBe(quota2.name);
    });

    it('should create quota with REDIRECT action', async () => {
      const quota = await quotaService.createQuota(testSurvey.id, {
        name: 'Redirect Quota',
        limit: 20,
        action: QuotaAction.REDIRECT,
        actionUrl: 'https://example.com/full',
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option C',
          },
        ],
      });

      expect(quota.action).toBe(QuotaAction.REDIRECT);
      expect(quota.actionUrl).toBe('https://example.com/full');
    });
  });

  describe('checkQuotas', () => {
    it('should return false when quota is not reached', async () => {
      await quotaService.createQuota(testSurvey.id, {
        name: 'Test Quota',
        limit: 10,
        action: QuotaAction.END_SURVEY,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option A',
          },
        ],
      });

      const result = await quotaService.checkQuotas(testSurvey.id, {
        [question.id]: 'Option A',
      });

      expect(result.quotaReached).toBe(false);
      expect(result.matchingQuotas.length).toBeGreaterThan(0);
    });

    it('should return true when quota is reached', async () => {
      const quota = await quotaService.createQuota(testSurvey.id, {
        name: 'Test Quota',
        limit: 1,
        action: QuotaAction.END_SURVEY,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option A',
          },
        ],
      });

      // Update quota to be at limit
      await prisma.quota.update({
        where: { id: quota.id },
        data: { currentCount: 1 },
      });

      const result = await quotaService.checkQuotas(testSurvey.id, {
        [question.id]: 'Option A',
      });

      expect(result.quotaReached).toBe(true);
    });

    it('should handle inactive quotas', async () => {
      const quota = await quotaService.createQuota(testSurvey.id, {
        name: 'Inactive Quota',
        limit: 5,
        action: QuotaAction.END_SURVEY,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option B',
          },
        ],
      });

      // Deactivate the quota
      await quotaService.updateQuota(quota.id, { isActive: false });

      // Update quota count to be at limit
      await prisma.quota.update({
        where: { id: quota.id },
        data: { currentCount: 5 },
      });

      const result = await quotaService.checkQuotas(testSurvey.id, {
        [question.id]: 'Option B',
      });

      // Inactive quotas should not be enforced
      expect(result.quotaReached).toBe(false);
      expect(result.matchingQuotas.length).toBe(0);
    });
  });

  describe('incrementQuotas', () => {
    it('should increment quota count when response matches', async () => {
      const quota = await quotaService.createQuota(testSurvey.id, {
        name: 'Test Quota',
        limit: 10,
        action: QuotaAction.END_SURVEY,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option A',
          },
        ],
      });

      const response = await responseFixtures.createResponse(testSurvey.id);

      await quotaService.incrementQuotas(response.id, [quota.id]);

      const updatedQuota = await prisma.quota.findUnique({
        where: { id: quota.id },
      });

      expect(updatedQuota?.currentCount).toBe(1);
    });

    it('should create quota response record', async () => {
      const quota = await quotaService.createQuota(testSurvey.id, {
        name: 'Test Quota',
        limit: 10,
        action: QuotaAction.END_SURVEY,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option A',
          },
        ],
      });

      const response = await responseFixtures.createResponse(testSurvey.id);

      await quotaService.incrementQuotas(response.id, [quota.id]);

      const quotaResponse = await prisma.quotaResponse.findFirst({
        where: {
          quotaId: quota.id,
          responseId: response.id,
        },
      });

      expect(quotaResponse).toBeTruthy();
    });
  });

  describe('getQuotaStatus', () => {
    it('should return status of all quotas for a survey', async () => {
      await quotaService.createQuota(testSurvey.id, {
        name: 'Quota A',
        limit: 10,
        action: QuotaAction.END_SURVEY,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option A',
          },
        ],
      });

      await quotaService.createQuota(testSurvey.id, {
        name: 'Quota B',
        limit: 5,
        action: QuotaAction.END_SURVEY,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option B',
          },
        ],
      });

      const status = await quotaService.getQuotaStatus(testSurvey.id);

      expect(status.quotas.length).toBe(2);
      status.quotas.forEach((quotaStatus: any) => {
        expect(quotaStatus).toHaveProperty('id');
        expect(quotaStatus).toHaveProperty('currentCount');
        expect(quotaStatus).toHaveProperty('limit');
        expect(quotaStatus).toHaveProperty('percentage');
      });
    });

    it('should calculate percentage correctly', async () => {
      const quota = await quotaService.createQuota(testSurvey.id, {
        name: 'Test Quota',
        limit: 10,
        action: QuotaAction.END_SURVEY,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option A',
          },
        ],
      });

      // Update quota count to 5
      await prisma.quota.update({
        where: { id: quota.id },
        data: { currentCount: 5 },
      });

      const status = await quotaService.getQuotaStatus(testSurvey.id);
      const quotaStatus = status.quotas.find((s: any) => s.id === quota.id);

      expect(quotaStatus?.percentage).toBe(50);
    });
  });

  describe('quota enforcement during response submission', () => {
    it('should prevent response when quota is full', async () => {
      const quota = await quotaService.createQuota(testSurvey.id, {
        name: 'Full Quota',
        limit: 1,
        action: QuotaAction.END_SURVEY,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option A',
          },
        ],
      });

      // Fill the quota
      const firstResponse = await responseFixtures.createResponse(testSurvey.id);
      await quotaService.incrementQuotas(firstResponse.id, [quota.id]);

      // Check if quota is full
      const result = await quotaService.checkQuotas(testSurvey.id, {
        [question.id]: 'Option A',
      });

      expect(result.quotaReached).toBe(true);
    });

    it('should allow submission when quota action is CONTINUE', async () => {
      const quota = await quotaService.createQuota(testSurvey.id, {
        name: 'Continue Quota',
        limit: 1,
        action: QuotaAction.CONTINUE,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option A',
          },
        ],
      });

      // Fill the quota
      const firstResponse = await responseFixtures.createResponse(testSurvey.id);
      await quotaService.incrementQuotas(firstResponse.id, [quota.id]);

      // Second response should still be "reachable" but action is CONTINUE
      const secondResponse = await responseFixtures.createResponse(testSurvey.id);

      expect(secondResponse).toBeTruthy();
    });
  });

  describe('deleteQuota', () => {
    it('should delete quota', async () => {
      const quota = await quotaService.createQuota(testSurvey.id, {
        name: 'To Be Deleted',
        limit: 10,
        action: QuotaAction.END_SURVEY,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option A',
          },
        ],
      });

      await quotaService.deleteQuota(quota.id);

      const deleted = await prisma.quota.findUnique({
        where: { id: quota.id },
      });

      expect(deleted).toBeNull();
    });
  });

  describe('updateQuota', () => {
    it('should update quota properties', async () => {
      const quota = await quotaService.createQuota(testSurvey.id, {
        name: 'Original Name',
        limit: 10,
        action: QuotaAction.END_SURVEY,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option A',
          },
        ],
      });

      const updated = await quotaService.updateQuota(quota.id, {
        name: 'Updated Name',
        limit: 20,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.limit).toBe(20);
    });

    it('should toggle quota active state', async () => {
      const quota = await quotaService.createQuota(testSurvey.id, {
        name: 'Toggle Quota',
        limit: 10,
        action: QuotaAction.END_SURVEY,
        conditions: [
          {
            questionId: question.id,
            operator: ConditionOperator.EQUALS,
            value: 'Option A',
          },
        ],
      });

      expect(quota.isActive).toBe(true);

      const toggled = await quotaService.toggleQuota(quota.id);

      expect(toggled.isActive).toBe(false);
    });
  });
});
