# Implement Survey Quota Management System

## Priority: P1 - High
## Labels: `feature`, `survey-logic`, `phase-1`, `enterprise`
## Estimated Effort: Medium

---

## Summary

Implement a quota management system that allows survey creators to limit responses based on respondent characteristics. This is essential for market research, academic studies, and ensuring representative samples.

---

## Background & Motivation

LimeSurvey has comprehensive quota management. Without quotas:
- Cannot ensure demographically balanced samples
- Cannot cap responses by segment (e.g., only 100 responses from each age group)
- Cannot conduct proper market research studies
- Academic researchers with sample requirements cannot use PulseGen

---

## Requirements

### Functional Requirements

1. **Quota Definition**
   - Create quotas based on question answers
   - Set numeric limits for each quota
   - Support single-condition and multi-condition quotas
   - Quota can be based on any question type with discrete answers

2. **Quota Actions**
   - When quota is reached:
     - End survey with custom message
     - Redirect to URL
     - Hide/show specific questions
     - Mark response as "over quota" but still collect
   - Configurable action per quota

3. **Quota Types**
   - **Simple Quota**: Single question, single answer (e.g., max 100 males)
   - **Compound Quota**: Multiple conditions (e.g., max 50 males AND age 18-24)
   - **Interlocked Quota**: Cross-tabulated quotas (age × gender matrix)

4. **Quota Monitoring**
   - Real-time quota status dashboard
   - Visual progress bars
   - Email alerts at thresholds (50%, 80%, 100%)
   - Export quota status

5. **Survey Creator Interface**
   - Visual quota builder
   - Preview quota conditions
   - Test quota logic
   - Clone/duplicate quotas

---

## Technical Implementation

### 1. Database Schema

**Add to `backend/prisma/schema.prisma`:**

```prisma
model Quota {
  id          String   @id @default(cuid())
  surveyId    String
  survey      Survey   @relation(fields: [surveyId], references: [id], onDelete: Cascade)

  name        String
  description String?
  limit       Int      // Maximum responses for this quota
  isActive    Boolean  @default(true)

  // Action when quota is reached
  action      QuotaAction @default(END_SURVEY)
  actionMessage String?  // Custom message for END_SURVEY
  actionUrl   String?    // URL for REDIRECT action

  // Tracking
  currentCount Int      @default(0)

  // Alert settings
  alertAt50   Boolean  @default(false)
  alertAt80   Boolean  @default(true)
  alertAt100  Boolean  @default(true)
  alertEmails String[] // Email addresses for alerts

  conditions  QuotaCondition[]
  responses   QuotaResponse[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([surveyId])
}

enum QuotaAction {
  END_SURVEY      // Show message and end
  REDIRECT        // Redirect to URL
  HIDE_QUESTIONS  // Hide specific questions but continue
  CONTINUE        // Mark as over-quota but collect anyway
}

model QuotaCondition {
  id          String   @id @default(cuid())
  quotaId     String
  quota       Quota    @relation(fields: [quotaId], references: [id], onDelete: Cascade)

  questionId  String
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  operator    ConditionOperator @default(EQUALS)
  value       String   // The answer value(s) to match
  values      String[] // For IN operator, multiple values

  // For compound quotas, conditions are ANDed together
  // For interlocked quotas, use separate Quota records

  @@index([quotaId])
  @@index([questionId])
}

enum ConditionOperator {
  EQUALS
  NOT_EQUALS
  IN
  NOT_IN
  GREATER_THAN
  LESS_THAN
  BETWEEN
  CONTAINS
}

model QuotaResponse {
  id          String   @id @default(cuid())
  quotaId     String
  quota       Quota    @relation(fields: [quotaId], references: [id], onDelete: Cascade)
  responseId  String
  response    Response @relation(fields: [responseId], references: [id], onDelete: Cascade)
  countedAt   DateTime @default(now())

  @@unique([quotaId, responseId])
  @@index([quotaId])
}

// Add to Survey model
model Survey {
  // ... existing fields
  quotas          Quota[]
  quotasEnabled   Boolean @default(false)
}

// Add to Response model
model Response {
  // ... existing fields
  quotaStatus     QuotaStatus @default(NORMAL)
  quotaResponses  QuotaResponse[]
}

enum QuotaStatus {
  NORMAL      // Within quota
  OVER_QUOTA  // Response collected but quota was full
  SCREENED    // Response rejected due to quota
}
```

### 2. Quota Service

**File: `backend/src/services/quotaService.ts`**

```typescript
import { prisma } from '../lib/prisma';
import { sendEmail } from './emailService';
import { Prisma, ConditionOperator, QuotaAction } from '@prisma/client';

export class QuotaService {
  /**
   * Check if response matches quota conditions
   */
  private matchesCondition(
    answer: any,
    condition: { operator: ConditionOperator; value: string; values: string[] }
  ): boolean {
    const { operator, value, values } = condition;
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
      await sendEmail({ to: email, subject, html });
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
   * Generate interlocked quota matrix
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
```

### 3. API Endpoints

**File: `backend/src/routes/quotaRoutes.ts`**

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { quotaService } from '../services/quotaService';
import { z } from 'zod';

const router = Router();

// Get quotas for a survey
router.get('/surveys/:surveyId/quotas', authenticate, async (req, res) => {
  const status = await quotaService.getQuotaStatus(req.params.surveyId);
  res.json(status);
});

// Create quota
router.post('/surveys/:surveyId/quotas', authenticate, async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    limit: z.number().min(1),
    action: z.enum(['END_SURVEY', 'REDIRECT', 'HIDE_QUESTIONS', 'CONTINUE']),
    actionMessage: z.string().optional(),
    actionUrl: z.string().url().optional(),
    alertEmails: z.array(z.string().email()).optional(),
    conditions: z.array(z.object({
      questionId: z.string(),
      operator: z.enum(['EQUALS', 'NOT_EQUALS', 'IN', 'NOT_IN', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'CONTAINS']),
      value: z.string(),
      values: z.array(z.string()).optional(),
    })).min(1),
  });

  try {
    const data = schema.parse(req.body);
    const quota = await quotaService.createQuota(req.params.surveyId, data);
    res.status(201).json(quota);
  } catch (error) {
    res.status(400).json({ error: 'Invalid quota configuration' });
  }
});

// Update quota
router.put('/quotas/:quotaId', authenticate, async (req, res) => {
  // Implementation
});

// Delete quota
router.delete('/quotas/:quotaId', authenticate, async (req, res) => {
  await prisma.quota.delete({ where: { id: req.params.quotaId } });
  res.json({ success: true });
});

// Toggle quota active state
router.patch('/quotas/:quotaId/toggle', authenticate, async (req, res) => {
  const quota = await prisma.quota.findUnique({
    where: { id: req.params.quotaId },
    select: { isActive: true },
  });

  const updated = await prisma.quota.update({
    where: { id: req.params.quotaId },
    data: { isActive: !quota?.isActive },
  });

  res.json(updated);
});

// Create interlocked quotas
router.post('/surveys/:surveyId/quotas/interlocked', authenticate, async (req, res) => {
  const schema = z.object({
    name: z.string(),
    question1Id: z.string(),
    question1Values: z.array(z.string()),
    question2Id: z.string(),
    question2Values: z.array(z.string()),
    limits: z.record(z.record(z.number())),
    action: z.enum(['END_SURVEY', 'REDIRECT', 'HIDE_QUESTIONS', 'CONTINUE']),
  });

  try {
    const data = schema.parse(req.body);
    await quotaService.createInterlockedQuotas(req.params.surveyId, data);
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid configuration' });
  }
});

// Check quotas (public - for survey taking)
router.post('/surveys/:surveyId/quotas/check', async (req, res) => {
  const { answers } = req.body;
  const result = await quotaService.checkQuotas(req.params.surveyId, answers);
  res.json(result);
});

export default router;
```

### 4. Frontend: Quota Builder

**File: `frontend/src/components/survey/QuotaBuilder.tsx`**

```typescript
import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface QuotaBuilderProps {
  surveyId: string;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    options?: Array<{ id: string; text: string }>;
  }>;
}

export function QuotaBuilder({ surveyId, questions }: QuotaBuilderProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newQuota, setNewQuota] = useState({
    name: '',
    limit: 100,
    action: 'END_SURVEY',
    actionMessage: 'Thank you, but we have already received enough responses for your demographic.',
    conditions: [{ questionId: '', operator: 'EQUALS', value: '' }],
  });

  const { data: quotaStatus, isLoading } = useQuery({
    queryKey: ['quotas', surveyId],
    queryFn: () => api.get(`/surveys/${surveyId}/quotas`).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(`/surveys/${surveyId}/quotas`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotas', surveyId] });
      setIsAdding(false);
      setNewQuota({
        name: '',
        limit: 100,
        action: 'END_SURVEY',
        actionMessage: 'Thank you, but we have already received enough responses.',
        conditions: [{ questionId: '', operator: 'EQUALS', value: '' }],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (quotaId: string) => api.delete(`/quotas/${quotaId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotas', surveyId] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (quotaId: string) => api.patch(`/quotas/${quotaId}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotas', surveyId] });
    },
  });

  // Only show questions with discrete answers
  const eligibleQuestions = questions.filter(q =>
    ['MULTIPLE_CHOICE', 'DROPDOWN', 'YES_NO', 'GENDER', 'RATING_SCALE', 'NPS', 'LIKERT_SCALE'].includes(q.type)
  );

  const addCondition = () => {
    setNewQuota(prev => ({
      ...prev,
      conditions: [...prev.conditions, { questionId: '', operator: 'EQUALS', value: '' }],
    }));
  };

  const removeCondition = (index: number) => {
    setNewQuota(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (index: number, field: string, value: string) => {
    setNewQuota(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  if (isLoading) return <div>Loading quotas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quota Management</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md"
        >
          <Plus className="w-4 h-4" />
          Add Quota
        </button>
      </div>

      {/* Existing quotas */}
      <div className="space-y-4">
        {quotaStatus?.quotas.map((quota: any) => (
          <div
            key={quota.id}
            className={`border rounded-lg p-4 ${!quota.isActive ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{quota.name}</h4>
                <div className="text-sm text-gray-600 mt-1">
                  {quota.conditions.map((c: any, i: number) => (
                    <span key={i}>
                      {i > 0 && ' AND '}
                      {c.questionText} {c.operator} "{c.value}"
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleMutation.mutate(quota.id)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {quota.isActive ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(quota.id)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{quota.currentCount} / {quota.limit}</span>
                <span>{quota.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    quota.percentage >= 100 ? 'bg-red-500' :
                    quota.percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(quota.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}

        {quotaStatus?.quotas.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No quotas configured</p>
            <p className="text-sm">Add quotas to control response distribution</p>
          </div>
        )}
      </div>

      {/* Add new quota form */}
      {isAdding && (
        <div className="border rounded-lg p-6 bg-gray-50">
          <h4 className="font-medium mb-4">New Quota</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newQuota.name}
                onChange={(e) => setNewQuota(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Male respondents"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Limit</label>
              <input
                type="number"
                value={newQuota.limit}
                onChange={(e) => setNewQuota(prev => ({ ...prev, limit: parseInt(e.target.value) || 0 }))}
                min={1}
                className="w-32 px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Conditions</label>
              {newQuota.conditions.map((condition, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={condition.questionId}
                    onChange={(e) => updateCondition(index, 'questionId', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md"
                  >
                    <option value="">Select question...</option>
                    {eligibleQuestions.map(q => (
                      <option key={q.id} value={q.id}>{q.text}</option>
                    ))}
                  </select>

                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    className="w-32 px-3 py-2 border rounded-md"
                  >
                    <option value="EQUALS">equals</option>
                    <option value="NOT_EQUALS">not equals</option>
                    <option value="IN">in</option>
                  </select>

                  <select
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md"
                  >
                    <option value="">Select answer...</option>
                    {eligibleQuestions
                      .find(q => q.id === condition.questionId)
                      ?.options?.map(opt => (
                        <option key={opt.id} value={opt.text}>{opt.text}</option>
                      ))}
                  </select>

                  {newQuota.conditions.length > 1 && (
                    <button
                      onClick={() => removeCondition(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addCondition}
                className="text-sm text-primary hover:underline"
              >
                + Add condition (AND)
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">When quota is reached</label>
              <select
                value={newQuota.action}
                onChange={(e) => setNewQuota(prev => ({ ...prev, action: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="END_SURVEY">End survey with message</option>
                <option value="REDIRECT">Redirect to URL</option>
                <option value="CONTINUE">Continue but mark as over-quota</option>
              </select>
            </div>

            {newQuota.action === 'END_SURVEY' && (
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={newQuota.actionMessage}
                  onChange={(e) => setNewQuota(prev => ({ ...prev, actionMessage: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate(newQuota)}
                disabled={!newQuota.name || newQuota.conditions.some(c => !c.questionId || !c.value)}
                className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
              >
                Create Quota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] Survey creators can enable/disable quotas per survey
- [ ] Can create simple single-condition quotas
- [ ] Can create compound multi-condition quotas (AND logic)
- [ ] Can create interlocked quota matrices
- [ ] Quota limits are enforced during survey taking
- [ ] Configurable actions when quota reached (end, redirect, continue)
- [ ] Real-time quota count updates
- [ ] Visual progress bars for each quota
- [ ] Email alerts at configurable thresholds
- [ ] Quota status visible in analytics dashboard
- [ ] Can export quota status report
- [ ] Response is marked with quota status
- [ ] Works correctly with high concurrency
- [ ] Unit tests for quota matching logic
- [ ] Integration tests for quota API

---

## Files to Create/Modify

### New Files
- `backend/src/services/quotaService.ts`
- `backend/src/routes/quotaRoutes.ts`
- `frontend/src/components/survey/QuotaBuilder.tsx`
- `frontend/src/components/survey/QuotaStatus.tsx`

### Modified Files
- `backend/prisma/schema.prisma`
- `backend/src/routes/index.ts`
- `backend/src/routes/responseRoutes.ts` - Check quotas on submit
- `frontend/src/pages/SurveyBuilder.tsx` - Add quota tab
- `frontend/src/pages/SurveyAnalytics.tsx` - Show quota status

---

## Dependencies

- Issue #005 (Question Types) - Some new types may be used in quotas

---

## Concurrency Considerations

Quota counting must handle race conditions. Use database transactions and optimistic locking:

```typescript
// In quotaService.ts
async incrementQuotasAtomic(quotaIds: string[]): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    for (const quotaId of quotaIds) {
      // Lock and check
      const quota = await tx.quota.findUnique({
        where: { id: quotaId },
      });

      if (quota && quota.currentCount >= quota.limit) {
        // Quota full, rollback transaction
        throw new Error('QUOTA_FULL');
      }

      // Increment
      await tx.quota.update({
        where: { id: quotaId },
        data: { currentCount: { increment: 1 } },
      });
    }
    return true;
  });
}
```
