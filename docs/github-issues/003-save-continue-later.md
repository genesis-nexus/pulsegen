# Implement Save & Continue Later Feature

## Priority: P1 - High
## Labels: `feature`, `ux`, `phase-1`, `survey-respondent`, `critical`
## Estimated Effort: Medium

---

## Summary

Allow survey respondents to save their progress and continue completing a survey at a later time. This is critical for long surveys where respondents may not have time to complete everything in one session.

---

## Background & Motivation

LimeSurvey offers "Save and Continue" functionality as a core feature. Without this capability:
- Long surveys (10+ minutes) have high abandonment rates
- Respondents lose all progress if they close the browser
- Complex surveys requiring research/lookup are difficult to complete
- Mobile users who get interrupted lose their progress

Research shows surveys longer than 7 minutes have 20%+ higher completion rates when save/continue is available.

---

## Requirements

### Functional Requirements

1. **Save Progress**
   - Auto-save answers as respondent progresses (optional)
   - Manual "Save & Continue Later" button
   - Generate unique resume link/code
   - Option to email resume link to respondent
   - Store partial responses securely

2. **Resume Survey**
   - Resume from unique link with token
   - Resume from code entry on survey page
   - Show which questions were already answered
   - Allow editing of previous answers
   - Continue from where they left off

3. **Survey Creator Settings**
   - Enable/disable save & continue per survey
   - Auto-save frequency (off, per question, per page)
   - Expiration period for saved responses (1 day, 7 days, 30 days, never)
   - Require email for save (for sending resume link)
   - Allow anonymous save (token-only)

4. **Data Management**
   - Clear expired partial responses automatically
   - Track partial vs complete responses separately
   - Admin can view/delete partial responses

---

## Technical Implementation

### 1. Database Schema Changes

**Add to `backend/prisma/schema.prisma`:**

```prisma
model Survey {
  // ... existing fields

  // Save & Continue settings
  allowSaveAndContinue  Boolean  @default(false)
  autoSaveEnabled       Boolean  @default(false)
  autoSaveFrequency     String   @default("page") // "question", "page", "off"
  saveExpirationDays    Int      @default(7)      // 0 = never expires
  requireEmailForSave   Boolean  @default(false)

  partialResponses      PartialResponse[]
}

model PartialResponse {
  id                String   @id @default(cuid())
  surveyId          String
  survey            Survey   @relation(fields: [surveyId], references: [id], onDelete: Cascade)

  // Resume token (unique, unguessable)
  resumeToken       String   @unique @default(cuid())
  resumeCode        String?  // Optional short code for manual entry (6 chars)

  // Respondent identification (optional)
  respondentEmail   String?
  respondentName    String?

  // Progress tracking
  currentPageIndex  Int      @default(0)
  lastQuestionId    String?

  // Stored answers (JSON blob)
  answers           Json     // { questionId: { value, updatedAt } }

  // Metadata
  ipAddress         String?
  userAgent         String?
  startedAt         DateTime @default(now())
  lastSavedAt       DateTime @default(now())
  expiresAt         DateTime

  // Status
  status            PartialResponseStatus @default(IN_PROGRESS)
  convertedToResponseId String? // If completed, link to final Response

  @@index([surveyId])
  @@index([resumeToken])
  @@index([resumeCode])
  @@index([expiresAt])
  @@index([respondentEmail])
}

enum PartialResponseStatus {
  IN_PROGRESS
  COMPLETED
  EXPIRED
  ABANDONED
}
```

### 2. Backend API Endpoints

**File: `backend/src/routes/partialResponseRoutes.ts`**

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { generateResumeCode, sendResumeEmail } from '../services/partialResponseService';
import { addDays } from 'date-fns';

const router = Router();

// Save partial response (create or update)
const savePartialSchema = z.object({
  surveyId: z.string(),
  answers: z.record(z.any()),
  currentPageIndex: z.number(),
  lastQuestionId: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  resumeToken: z.string().optional(), // If continuing existing partial
});

router.post('/save', async (req, res) => {
  try {
    const data = savePartialSchema.parse(req.body);

    // Get survey settings
    const survey = await prisma.survey.findUnique({
      where: { id: data.surveyId },
      select: {
        id: true,
        allowSaveAndContinue: true,
        saveExpirationDays: true,
        requireEmailForSave: true,
      },
    });

    if (!survey || !survey.allowSaveAndContinue) {
      return res.status(400).json({ error: 'Save & Continue not enabled for this survey' });
    }

    if (survey.requireEmailForSave && !data.email) {
      return res.status(400).json({ error: 'Email is required to save progress' });
    }

    const expiresAt = survey.saveExpirationDays > 0
      ? addDays(new Date(), survey.saveExpirationDays)
      : addDays(new Date(), 365 * 10); // 10 years if "never"

    let partialResponse;

    if (data.resumeToken) {
      // Update existing partial response
      partialResponse = await prisma.partialResponse.update({
        where: { resumeToken: data.resumeToken },
        data: {
          answers: data.answers,
          currentPageIndex: data.currentPageIndex,
          lastQuestionId: data.lastQuestionId,
          lastSavedAt: new Date(),
          respondentEmail: data.email,
          respondentName: data.name,
        },
      });
    } else {
      // Create new partial response
      const resumeCode = generateResumeCode(); // 6-char alphanumeric

      partialResponse = await prisma.partialResponse.create({
        data: {
          surveyId: data.surveyId,
          answers: data.answers,
          currentPageIndex: data.currentPageIndex,
          lastQuestionId: data.lastQuestionId,
          resumeCode,
          expiresAt,
          respondentEmail: data.email,
          respondentName: data.name,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    }

    // Generate resume URL
    const resumeUrl = `${process.env.APP_URL}/survey/${survey.id}/resume/${partialResponse.resumeToken}`;

    // Send email if provided
    if (data.email && !data.resumeToken) {
      await sendResumeEmail({
        email: data.email,
        name: data.name,
        resumeUrl,
        resumeCode: partialResponse.resumeCode!,
        surveyTitle: survey.title,
        expiresAt,
      });
    }

    res.json({
      success: true,
      resumeToken: partialResponse.resumeToken,
      resumeCode: partialResponse.resumeCode,
      resumeUrl,
      expiresAt: partialResponse.expiresAt,
    });
  } catch (error) {
    console.error('Save partial response error:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Resume survey from token
router.get('/resume/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const partialResponse = await prisma.partialResponse.findUnique({
      where: { resumeToken: token },
      include: {
        survey: {
          include: {
            pages: {
              include: {
                questions: {
                  include: { options: true },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!partialResponse) {
      return res.status(404).json({ error: 'Resume link not found or expired' });
    }

    if (partialResponse.status === 'EXPIRED' || partialResponse.expiresAt < new Date()) {
      await prisma.partialResponse.update({
        where: { id: partialResponse.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(410).json({ error: 'This save has expired. Please start a new survey.' });
    }

    if (partialResponse.status === 'COMPLETED') {
      return res.status(400).json({ error: 'This survey has already been completed.' });
    }

    res.json({
      survey: partialResponse.survey,
      savedAnswers: partialResponse.answers,
      currentPageIndex: partialResponse.currentPageIndex,
      lastQuestionId: partialResponse.lastQuestionId,
      resumeToken: partialResponse.resumeToken,
      savedAt: partialResponse.lastSavedAt,
    });
  } catch (error) {
    console.error('Resume survey error:', error);
    res.status(500).json({ error: 'Failed to resume survey' });
  }
});

// Resume from code (for manual entry)
router.post('/resume-by-code', async (req, res) => {
  try {
    const { surveyId, code } = req.body;

    const partialResponse = await prisma.partialResponse.findFirst({
      where: {
        surveyId,
        resumeCode: code.toUpperCase(),
        status: 'IN_PROGRESS',
        expiresAt: { gt: new Date() },
      },
    });

    if (!partialResponse) {
      return res.status(404).json({ error: 'Invalid code or session expired' });
    }

    // Redirect to token-based resume
    res.json({
      resumeToken: partialResponse.resumeToken,
      resumeUrl: `${process.env.APP_URL}/survey/${surveyId}/resume/${partialResponse.resumeToken}`,
    });
  } catch (error) {
    console.error('Resume by code error:', error);
    res.status(500).json({ error: 'Failed to find saved progress' });
  }
});

// Convert partial to complete response
router.post('/:token/complete', async (req, res) => {
  try {
    const { token } = req.params;
    const { finalAnswers } = req.body;

    const partialResponse = await prisma.partialResponse.findUnique({
      where: { resumeToken: token },
    });

    if (!partialResponse || partialResponse.status !== 'IN_PROGRESS') {
      return res.status(404).json({ error: 'Invalid or completed session' });
    }

    // Create final response
    const response = await prisma.$transaction(async (tx) => {
      // Create the completed response
      const newResponse = await tx.response.create({
        data: {
          surveyId: partialResponse.surveyId,
          respondentEmail: partialResponse.respondentEmail,
          ipAddress: partialResponse.ipAddress,
          userAgent: partialResponse.userAgent,
          isComplete: true,
          startedAt: partialResponse.startedAt,
          completedAt: new Date(),
          answers: {
            create: Object.entries(finalAnswers).map(([questionId, value]) => ({
              questionId,
              value: typeof value === 'string' ? value : JSON.stringify(value),
            })),
          },
        },
      });

      // Mark partial as completed
      await tx.partialResponse.update({
        where: { id: partialResponse.id },
        data: {
          status: 'COMPLETED',
          convertedToResponseId: newResponse.id,
        },
      });

      return newResponse;
    });

    res.json({ success: true, responseId: response.id });
  } catch (error) {
    console.error('Complete survey error:', error);
    res.status(500).json({ error: 'Failed to submit survey' });
  }
});

export default router;
```

### 3. Service Layer

**File: `backend/src/services/partialResponseService.ts`**

```typescript
import crypto from 'crypto';
import { sendEmail } from './emailService';

// Generate a 6-character alphanumeric code
export function generateResumeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(crypto.randomInt(chars.length));
  }
  return code;
}

export async function sendResumeEmail({
  email,
  name,
  resumeUrl,
  resumeCode,
  surveyTitle,
  expiresAt,
}: {
  email: string;
  name?: string;
  resumeUrl: string;
  resumeCode: string;
  surveyTitle: string;
  expiresAt: Date;
}) {
  const greeting = name ? `Hi ${name}` : 'Hi';
  const expiryText = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  await sendEmail({
    to: email,
    subject: `Continue your survey: ${surveyTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your survey progress has been saved</h2>

        <p>${greeting},</p>

        <p>Your progress on <strong>"${surveyTitle}"</strong> has been saved.
        You can continue where you left off anytime before <strong>${expiryText}</strong>.</p>

        <div style="margin: 30px 0;">
          <a href="${resumeUrl}"
             style="background-color: #3b82f6; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Continue Survey
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          Or enter this code on the survey page: <strong style="font-size: 18px;">${resumeCode}</strong>
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

        <p style="color: #999; font-size: 12px;">
          This link will expire on ${expiryText}. If you didn't request this, you can ignore this email.
        </p>
      </div>
    `,
    text: `
Your survey progress has been saved

${greeting},

Your progress on "${surveyTitle}" has been saved. You can continue where you left off anytime before ${expiryText}.

Continue here: ${resumeUrl}

Or enter this code on the survey page: ${resumeCode}

This link will expire on ${expiryText}.
    `,
  });
}

// Cleanup job for expired partial responses
export async function cleanupExpiredPartialResponses() {
  const result = await prisma.partialResponse.updateMany({
    where: {
      status: 'IN_PROGRESS',
      expiresAt: { lt: new Date() },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  console.log(`Marked ${result.count} partial responses as expired`);

  // Optionally delete very old expired responses (e.g., 30 days after expiry)
  const deleteOlderThan = new Date();
  deleteOlderThan.setDate(deleteOlderThan.getDate() - 30);

  const deleted = await prisma.partialResponse.deleteMany({
    where: {
      status: 'EXPIRED',
      expiresAt: { lt: deleteOlderThan },
    },
  });

  console.log(`Deleted ${deleted.count} old expired partial responses`);
}
```

### 4. Frontend Components

**File: `frontend/src/components/survey/SaveProgressModal.tsx`**

```typescript
import React, { useState } from 'react';
import { X, Mail, Copy, Check } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SaveProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyId: string;
  answers: Record<string, any>;
  currentPageIndex: number;
  lastQuestionId?: string;
  resumeToken?: string;
  requireEmail: boolean;
}

export function SaveProgressModal({
  isOpen,
  onClose,
  surveyId,
  answers,
  currentPageIndex,
  lastQuestionId,
  resumeToken,
  requireEmail,
}: SaveProgressModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedData, setSavedData] = useState<{
    resumeUrl: string;
    resumeCode: string;
    expiresAt: string;
  } | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/partial-responses/save', {
        surveyId,
        answers,
        currentPageIndex,
        lastQuestionId,
        resumeToken,
        email: email || undefined,
        name: name || undefined,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSavedData(data);
    },
  });

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Save Your Progress</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {!savedData ? (
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
              <p className="text-gray-600 mb-4">
                Save your progress and get a link to continue later.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email {requireEmail ? '*' : '(optional)'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required={requireEmail}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    We'll send you a link to continue your survey
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-2 border rounded-md"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="w-full mt-6 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Progress'}
              </button>

              {saveMutation.isError && (
                <p className="text-red-500 text-sm mt-2">
                  Failed to save progress. Please try again.
                </p>
              )}
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-800 font-medium">Progress saved!</p>
                <p className="text-green-600 text-sm mt-1">
                  {email ? 'We sent a link to your email.' : 'Use the link below to continue.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Your Resume Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={savedData.resumeUrl}
                    className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(savedData.resumeUrl)}
                    className="px-3 py-2 border rounded-md hover:bg-gray-50"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Or use this code</label>
                <div className="text-2xl font-mono font-bold text-center py-3 bg-gray-100 rounded-md">
                  {savedData.resumeCode}
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Expires: {new Date(savedData.expiresAt).toLocaleDateString()}
              </p>

              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200"
              >
                Continue Survey
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**File: `frontend/src/components/survey/ResumeCodeInput.tsx`**

```typescript
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface ResumeCodeInputProps {
  surveyId: string;
}

export function ResumeCodeInput({ surveyId }: ResumeCodeInputProps) {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const resumeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/partial-responses/resume-by-code', {
        surveyId,
        code,
      });
      return response.data;
    },
    onSuccess: (data) => {
      navigate(`/survey/${surveyId}/resume/${data.resumeToken}`);
    },
  });

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-medium mb-2">Have a resume code?</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter 6-digit code"
          maxLength={6}
          className="flex-1 px-3 py-2 border rounded-md font-mono text-lg tracking-wider uppercase"
        />
        <button
          onClick={() => resumeMutation.mutate()}
          disabled={code.length !== 6 || resumeMutation.isPending}
          className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
        >
          Resume
        </button>
      </div>
      {resumeMutation.isError && (
        <p className="text-red-500 text-sm mt-2">
          Invalid code or session expired
        </p>
      )}
    </div>
  );
}
```

### 5. Auto-Save Hook

**File: `frontend/src/hooks/useAutoSave.ts`**

```typescript
import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useDebounce } from './useDebounce';

interface UseAutoSaveOptions {
  surveyId: string;
  answers: Record<string, any>;
  currentPageIndex: number;
  lastQuestionId?: string;
  resumeToken?: string;
  enabled: boolean;
  frequency: 'question' | 'page' | 'off';
  onSaved?: (token: string) => void;
}

export function useAutoSave({
  surveyId,
  answers,
  currentPageIndex,
  lastQuestionId,
  resumeToken,
  enabled,
  frequency,
  onSaved,
}: UseAutoSaveOptions) {
  const tokenRef = useRef(resumeToken);
  const debouncedAnswers = useDebounce(answers, frequency === 'question' ? 2000 : 0);
  const previousPageRef = useRef(currentPageIndex);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/partial-responses/save', {
        surveyId,
        answers,
        currentPageIndex,
        lastQuestionId,
        resumeToken: tokenRef.current,
      });
      return response.data;
    },
    onSuccess: (data) => {
      tokenRef.current = data.resumeToken;
      onSaved?.(data.resumeToken);
    },
  });

  // Auto-save on question change (debounced)
  useEffect(() => {
    if (!enabled || frequency !== 'question') return;
    if (Object.keys(debouncedAnswers).length === 0) return;

    saveMutation.mutate();
  }, [debouncedAnswers, enabled, frequency]);

  // Auto-save on page change
  useEffect(() => {
    if (!enabled || frequency !== 'page') return;
    if (previousPageRef.current === currentPageIndex) return;
    if (Object.keys(answers).length === 0) return;

    previousPageRef.current = currentPageIndex;
    saveMutation.mutate();
  }, [currentPageIndex, enabled, frequency, answers]);

  return {
    isSaving: saveMutation.isPending,
    lastSaved: saveMutation.data?.lastSavedAt,
    resumeToken: tokenRef.current,
  };
}
```

---

## Acceptance Criteria

- [ ] Survey creator can enable/disable Save & Continue per survey
- [ ] Survey creator can configure auto-save frequency
- [ ] Survey creator can set expiration period
- [ ] Survey creator can require email for saving
- [ ] Respondent can manually save progress via button
- [ ] Respondent receives resume link and code on save
- [ ] Email is sent with resume link when email provided
- [ ] Respondent can resume via unique URL
- [ ] Respondent can resume by entering code
- [ ] Previously answered questions are pre-filled
- [ ] Respondent continues from last position
- [ ] Auto-save works without user interaction
- [ ] Expired partial responses are handled gracefully
- [ ] Partial responses are cleaned up automatically
- [ ] Admin can view partial responses in analytics
- [ ] Works correctly on mobile devices
- [ ] Unit tests for service layer
- [ ] Integration tests for API endpoints

---

## Files to Create/Modify

### New Files
- `backend/src/routes/partialResponseRoutes.ts`
- `backend/src/services/partialResponseService.ts`
- `backend/src/jobs/cleanupPartialResponses.ts`
- `frontend/src/components/survey/SaveProgressModal.tsx`
- `frontend/src/components/survey/ResumeCodeInput.tsx`
- `frontend/src/hooks/useAutoSave.ts`
- `frontend/src/pages/SurveyResume.tsx`

### Modified Files
- `backend/prisma/schema.prisma`
- `backend/src/routes/index.ts`
- `frontend/src/pages/SurveyTake.tsx`
- `frontend/src/pages/SurveyBuilder.tsx` (settings)
- `frontend/src/App.tsx` (add resume route)

---

## Dependencies

- Working email service (SMTP configuration)
- Cron job setup for cleanup task

---

## Related Issues

- Issue #001 (i18n) - Email templates need translation
- Issue #002 (Progress Bar) - Show progress on resume
