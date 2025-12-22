import { prisma } from '../config/database';
import { EmailService } from './emailService';
import { ConditionOperator, QuotaAction } from '@prisma/client';

export class QuotaService {
  /**
   * Check if response matches quota conditions
   */
  private matchesCondition(
    answer: any,
    condition: { operator: ConditionOperator; value: string; values: string[] }
  ): boolean {
    const { operator, value, values } = condition;

    // Handle null/undefined answers
    if (answer === undefined || answer === null) return false;

    const answerStr = String(answer).toLowerCase();
    const valueStr = value.toLowerCase();

    switch (operator) {
      case 'EQUALS':
        return answerStr === valueStr;
      case 'NOT_EQUALS':
        return answerStr !== valueStr;
      case 'IN':
        return values.map(v => v.toLowerCase()).includes(answerStr);
      case 'NOT_IN':
        return !values.map(v => v.toLowerCase()).includes(answerStr);
      case 'GREATER_THAN':
        return parseFloat(answer) > parseFloat(value);
      case 'LESS_THAN':
        return parseFloat(answer) < parseFloat(value);
      case 'BETWEEN':
        const [min, max] = values.map(parseFloat);
        const num = parseFloat(answer);
        return num >= min && num <= max;
      case 'CONTAINS':
        return answerStr.includes(valueStr);
      default:
        return false;
    }
  }

  /**
   * Check quotas for a survey response
   * Returns quota info if any quota is reached/exceeded
   */
  async checkQuotas(
    surveyId: string,
    answers: Record<string, any>
  ): Promise<{
    quotaReached: boolean;
    quota?: {
      id: string;
      name: string;
      action: QuotaAction;
      message?: string;
      url?: string;
    };
    matchingQuotas: string[];
  }> {
    const quotas = await prisma.quota.findMany({
      where: {
        surveyId,
        isActive: true,
      },
      include: {
        conditions: true,
      },
    });

    const matchingQuotas: string[] = [];
    let reachedQuota = null;

    for (const quota of quotas) {
      // Check if all conditions match (AND logic)
      const allConditionsMatch = quota.conditions.every(condition => {
        const answer = answers[condition.questionId];
        if (answer === undefined) return false;
        return this.matchesCondition(answer, condition);
      });

      if (allConditionsMatch) {
        matchingQuotas.push(quota.id);

        // Check if quota is reached
        if (quota.currentCount >= quota.limit && !reachedQuota) {
          reachedQuota = quota;
        }
      }
    }

    return {
      quotaReached: reachedQuota !== null,
      quota: reachedQuota
        ? {
            id: reachedQuota.id,
            name: reachedQuota.name,
            action: reachedQuota.action,
            message: reachedQuota.actionMessage || undefined,
            url: reachedQuota.actionUrl || undefined,
          }
        : undefined,
      matchingQuotas,
    };
  }

  /**
   * Increment quota counts after response submission
   */
  async incrementQuotas(
    responseId: string,
    quotaIds: string[]
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const quotaId of quotaIds) {
        // Link response to quota
        await tx.quotaResponse.create({
          data: { quotaId, responseId },
        });

        // Increment count
        const quota = await tx.quota.update({
          where: { id: quotaId },
          data: { currentCount: { increment: 1 } },
          include: { survey: { select: { title: true } } },
        });

        // Check for alert thresholds
        await this.checkAlerts(quota);
      }
    });
  }

  /**
   * Increment quota counts atomically with quota checking
   * Returns false if any quota is full (rollback transaction)
   */
  async incrementQuotasAtomic(
    responseId: string,
    quotaIds: string[]
  ): Promise<boolean> {
    try {
      await prisma.$transaction(async (tx) => {
        for (const quotaId of quotaIds) {
          // Lock and check quota
          const quota = await tx.quota.findUnique({
            where: { id: quotaId },
          });

          if (quota && quota.currentCount >= quota.limit) {
            // Quota full, rollback transaction
            throw new Error('QUOTA_FULL');
          }

          // Link response to quota
          await tx.quotaResponse.create({
            data: { quotaId, responseId },
          });

          // Increment count
          const updatedQuota = await tx.quota.update({
            where: { id: quotaId },
            data: { currentCount: { increment: 1 } },
            include: { survey: { select: { title: true } } },
          });

          // Check for alert thresholds
          await this.checkAlerts(updatedQuota);
        }
      });
      return true;
    } catch (error: any) {
      if (error.message === 'QUOTA_FULL') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Check if quota has hit alert thresholds
   */
  private async checkAlerts(quota: any): Promise<void> {
    const percentage = (quota.currentCount / quota.limit) * 100;
    const prevPercentage = ((quota.currentCount - 1) / quota.limit) * 100;

    const thresholds = [
      { level: 50, enabled: quota.alertAt50 },
      { level: 80, enabled: quota.alertAt80 },
      { level: 100, enabled: quota.alertAt100 },
    ];

    for (const threshold of thresholds) {
      if (
        threshold.enabled &&
        percentage >= threshold.level &&
        prevPercentage < threshold.level
      ) {
        await this.sendQuotaAlert(quota, threshold.level);
        break;
      }
    }
  }

  /**
   * Send quota alert email
   */
  private async sendQuotaAlert(quota: any, percentage: number): Promise<void> {
    if (quota.alertEmails.length === 0) return;

    const subject = percentage >= 100
      ? `Quota "${quota.name}" is FULL`
      : `Quota "${quota.name}" is ${percentage}% full`;

    const html = `
      <h2>Quota Alert</h2>
      <p>The quota "<strong>${quota.name}</strong>" for survey "${quota.survey.title}" has reached <strong>${percentage}%</strong> of its limit.</p>
      <ul>
        <li>Current count: ${quota.currentCount}</li>
        <li>Limit: ${quota.limit}</li>
      </ul>
      ${percentage >= 100 ? '<p><strong>This quota is now full. New matching responses will be handled according to your quota action settings.</strong></p>' : ''}
    `;

    for (const email of quota.alertEmails) {
      try {
        await EmailService.sendEmail({ to: email, subject, html });
      } catch (error) {
        console.error(`Failed to send quota alert to ${email}:`, error);
      }
    }
  }

  /**
   * Get quota status for a survey
   */
  async getQuotaStatus(surveyId: string): Promise<{
    quotas: Array<{
      id: string;
      name: string;
      limit: number;
      currentCount: number;
      percentage: number;
      isActive: boolean;
      action: string;
      conditions: Array<{
        questionText: string;
        operator: string;
        value: string;
      }>;
    }>;
    totalLimit: number;
    totalCount: number;
  }> {
    const quotas = await prisma.quota.findMany({
      where: { surveyId },
      include: {
        conditions: {
          include: {
            question: { select: { text: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      quotas: quotas.map(q => ({
        id: q.id,
        name: q.name,
        limit: q.limit,
        currentCount: q.currentCount,
        percentage: Math.round((q.currentCount / q.limit) * 100),
        isActive: q.isActive,
        action: q.action,
        conditions: q.conditions.map(c => ({
          questionText: c.question.text,
          operator: c.operator,
          value: c.values.length > 0 ? c.values.join(', ') : c.value,
        })),
      })),
      totalLimit: quotas.reduce((sum, q) => sum + q.limit, 0),
      totalCount: quotas.reduce((sum, q) => sum + q.currentCount, 0),
    };
  }

  /**
   * Create a new quota
   */
  async createQuota(
    surveyId: string,
    data: {
      name: string;
      description?: string;
      limit: number;
      action: QuotaAction;
      actionMessage?: string;
      actionUrl?: string;
      alertEmails?: string[];
      conditions: Array<{
        questionId: string;
        operator: ConditionOperator;
        value: string;
        values?: string[];
      }>;
    }
  ): Promise<any> {
    return prisma.quota.create({
      data: {
        surveyId,
        name: data.name,
        description: data.description,
        limit: data.limit,
        action: data.action,
        actionMessage: data.actionMessage,
        actionUrl: data.actionUrl,
        alertEmails: data.alertEmails || [],
        conditions: {
          create: data.conditions.map(c => ({
            questionId: c.questionId,
            operator: c.operator,
            value: c.value,
            values: c.values || [],
          })),
        },
      },
      include: { conditions: true },
    });
  }

  /**
   * Update an existing quota
   */
  async updateQuota(
    quotaId: string,
    data: {
      name?: string;
      description?: string;
      limit?: number;
      action?: QuotaAction;
      actionMessage?: string;
      actionUrl?: string;
      alertEmails?: string[];
      isActive?: boolean;
    }
  ): Promise<any> {
    return prisma.quota.update({
      where: { id: quotaId },
      data,
      include: { conditions: true },
    });
  }

  /**
   * Delete a quota
   */
  async deleteQuota(quotaId: string): Promise<void> {
    await prisma.quota.delete({
      where: { id: quotaId },
    });
  }

  /**
   * Toggle quota active state
   */
  async toggleQuota(quotaId: string): Promise<any> {
    const quota = await prisma.quota.findUnique({
      where: { id: quotaId },
      select: { isActive: true },
    });

    return prisma.quota.update({
      where: { id: quotaId },
      data: { isActive: !quota?.isActive },
    });
  }

  /**
   * Generate interlocked quota matrix
   * Creates multiple quotas for cross-tabulated conditions (e.g., Age × Gender)
   */
  async createInterlockedQuotas(
    surveyId: string,
    config: {
      name: string;
      question1Id: string;
      question1Values: string[];
      question2Id: string;
      question2Values: string[];
      limits: Record<string, Record<string, number>>; // { value1: { value2: limit } }
      action: QuotaAction;
    }
  ): Promise<void> {
    const quotas = [];

    for (const val1 of config.question1Values) {
      for (const val2 of config.question2Values) {
        const limit = config.limits[val1]?.[val2] || 0;
        if (limit > 0) {
          quotas.push({
            surveyId,
            name: `${config.name}: ${val1} × ${val2}`,
            limit,
            action: config.action,
            conditions: {
              create: [
                { questionId: config.question1Id, operator: 'EQUALS' as const, value: val1, values: [] },
                { questionId: config.question2Id, operator: 'EQUALS' as const, value: val2, values: [] },
              ],
            },
          });
        }
      }
    }

    await prisma.$transaction(
      quotas.map(q => prisma.quota.create({ data: q }))
    );
  }
}

export const quotaService = new QuotaService();
