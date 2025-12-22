# Implement Participant Management System

## Priority: P0 - Critical
## Labels: `feature`, `phase-1`, `critical`, `enterprise`, `research`
## Estimated Effort: Large

---

## Summary

Implement a comprehensive participant management system that allows survey creators to manage respondent lists, send personalized invitations, track individual responses, and conduct controlled studies. This is critical for academic research, enterprise surveys, and panel management.

---

## Background & Motivation

LimeSurvey has robust participant management ("Token Management"). Without this capability, PulseGen cannot support:
- Academic research requiring response tracking per participant
- Enterprise employee surveys with specific recipient lists
- Customer feedback with known respondent pools
- Longitudinal studies tracking same participants over time
- Survey panels and research communities
- Response rate tracking and reminder campaigns

---

## Requirements

### Functional Requirements

#### 1. Participant Database
- Create/import participant lists per survey
- Store participant attributes (email, name, custom fields)
- Support for custom attributes (department, segment, etc.)
- Import from CSV/Excel
- Export participant lists
- Search and filter participants

#### 2. Token-Based Access
- Generate unique access tokens per participant
- Token can be single-use or multi-use
- Token can be time-limited
- Personalized survey links with embedded tokens
- Optional: Allow anonymous response with token validation

#### 3. Invitation System
- Send email invitations with personalized links
- Customizable email templates with merge fields
- Schedule invitation delivery
- Batch sending with rate limiting
- Track delivery status (sent, delivered, bounced)

#### 4. Reminder System
- Configure automatic reminders for non-respondents
- Set reminder schedule (e.g., 3 days, 7 days after invite)
- Maximum reminder count
- Custom reminder message per reminder number
- Manual reminder to selected participants

#### 5. Response Tracking
- Link responses to participants (while maintaining optional anonymity)
- Track: Invited, Started, Completed, Opted-out
- View individual participant status
- Response completion timestamp
- Time spent on survey

#### 6. Opt-out Management
- Global opt-out link in emails
- Per-survey opt-out
- Respect opt-out in future surveys
- GDPR-compliant data handling

---

## Technical Implementation

### 1. Database Schema

**Add to `backend/prisma/schema.prisma`:**

```prisma
model Participant {
  id            String   @id @default(cuid())
  surveyId      String
  survey        Survey   @relation(fields: [surveyId], references: [id], onDelete: Cascade)

  // Identity
  email         String
  firstName     String?
  lastName      String?

  // Access token
  token         String   @unique @default(cuid())
  tokenUsed     Boolean  @default(false)
  tokenUsedAt   DateTime?

  // Settings
  tokenUsageLimit Int    @default(1) // 0 = unlimited
  tokenUsageCount Int    @default(0)
  validFrom     DateTime @default(now())
  validUntil    DateTime?

  // Custom attributes (flexible key-value)
  attributes    Json     @default("{}")

  // Status tracking
  status        ParticipantStatus @default(PENDING)
  invitedAt     DateTime?
  startedAt     DateTime?
  completedAt   DateTime?
  optedOutAt    DateTime?

  // Response link
  responseId    String?  @unique
  response      Response? @relation(fields: [responseId], references: [id])

  // Communication tracking
  invitations   ParticipantInvitation[]
  reminders     ParticipantReminder[]

  // Metadata
  language      String   @default("en")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([surveyId, email])
  @@index([surveyId])
  @@index([token])
  @@index([email])
  @@index([status])
}

enum ParticipantStatus {
  PENDING     // Added but not invited
  INVITED     // Invitation sent
  STARTED     // Started survey
  COMPLETED   // Finished survey
  OPTED_OUT   // Opted out
  BOUNCED     // Email bounced
  EXPIRED     // Token expired
}

model ParticipantInvitation {
  id              String   @id @default(cuid())
  participantId   String
  participant     Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)

  // Email details
  subject         String
  body            String
  sentAt          DateTime @default(now())

  // Delivery status
  status          EmailStatus @default(PENDING)
  deliveredAt     DateTime?
  openedAt        DateTime?
  clickedAt       DateTime?
  bouncedAt       DateTime?
  bounceReason    String?

  // Tracking
  messageId       String?  // From email provider
  trackingId      String   @unique @default(cuid())

  @@index([participantId])
}

model ParticipantReminder {
  id              String   @id @default(cuid())
  participantId   String
  participant     Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)

  reminderNumber  Int      // 1st, 2nd, 3rd reminder
  scheduledFor    DateTime
  sentAt          DateTime?
  status          EmailStatus @default(PENDING)

  @@index([participantId])
  @@index([scheduledFor])
}

enum EmailStatus {
  PENDING
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  FAILED
}

model SurveyEmailTemplate {
  id          String   @id @default(cuid())
  surveyId    String
  survey      Survey   @relation(fields: [surveyId], references: [id], onDelete: Cascade)

  type        EmailTemplateType
  subject     String
  body        String   // HTML with merge fields
  isDefault   Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([surveyId, type, isDefault])
  @@index([surveyId])
}

enum EmailTemplateType {
  INVITATION
  REMINDER_1
  REMINDER_2
  REMINDER_3
  COMPLETION_THANK_YOU
  OPT_OUT_CONFIRMATION
}

model GlobalOptOut {
  id        String   @id @default(cuid())
  email     String   @unique
  reason    String?
  optedOutAt DateTime @default(now())

  @@index([email])
}

// Update Survey model
model Survey {
  // ... existing fields

  // Participant settings
  participantsEnabled    Boolean @default(false)
  participantTokenMode   TokenMode @default(SINGLE_USE)
  allowAnonymousWithToken Boolean @default(false) // Token validates but doesn't link response
  requireToken           Boolean @default(false)  // Only token holders can respond

  participants           Participant[]
  emailTemplates         SurveyEmailTemplate[]
}

enum TokenMode {
  SINGLE_USE   // Token can only be used once
  MULTI_USE    // Token can be used multiple times
  TIME_LIMITED // Token valid for specific period
}

// Update Response model
model Response {
  // ... existing fields
  participant   Participant?
  participantId String?     @unique
}
```

### 2. Participant Service

**File: `backend/src/services/participantService.ts`**

```typescript
import { prisma } from '../lib/prisma';
import { sendEmail, trackEmailOpen, trackEmailClick } from './emailService';
import { generateToken } from '../lib/tokens';
import { parse as csvParse } from 'csv-parse/sync';
import { Participant, ParticipantStatus } from '@prisma/client';

export class ParticipantService {
  /**
   * Import participants from CSV
   */
  async importFromCSV(
    surveyId: string,
    csvContent: string,
    options: {
      hasHeader: boolean;
      emailColumn: number;
      firstNameColumn?: number;
      lastNameColumn?: number;
      attributeColumns?: Record<string, number>;
      skipDuplicates: boolean;
    }
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const rows = csvParse(csvContent, {
      skip_empty_lines: true,
      from_line: options.hasHeader ? 2 : 1,
    });

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const email = row[options.emailColumn]?.trim();

      if (!email || !this.isValidEmail(email)) {
        errors.push(`Row ${i + 1}: Invalid email`);
        continue;
      }

      // Check global opt-out
      const optedOut = await prisma.globalOptOut.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (optedOut) {
        skipped++;
        continue;
      }

      // Build attributes
      const attributes: Record<string, string> = {};
      if (options.attributeColumns) {
        for (const [key, col] of Object.entries(options.attributeColumns)) {
          if (row[col]) attributes[key] = row[col];
        }
      }

      try {
        await prisma.participant.create({
          data: {
            surveyId,
            email: email.toLowerCase(),
            firstName: options.firstNameColumn !== undefined ? row[options.firstNameColumn] : undefined,
            lastName: options.lastNameColumn !== undefined ? row[options.lastNameColumn] : undefined,
            attributes,
            token: generateToken(),
          },
        });
        imported++;
      } catch (error: any) {
        if (error.code === 'P2002' && options.skipDuplicates) {
          skipped++;
        } else {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }
    }

    return { imported, skipped, errors };
  }

  /**
   * Add single participant
   */
  async addParticipant(
    surveyId: string,
    data: {
      email: string;
      firstName?: string;
      lastName?: string;
      attributes?: Record<string, any>;
      language?: string;
    }
  ): Promise<Participant> {
    // Check global opt-out
    const optedOut = await prisma.globalOptOut.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (optedOut) {
      throw new Error('Email is on the opt-out list');
    }

    return prisma.participant.create({
      data: {
        surveyId,
        email: data.email.toLowerCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        attributes: data.attributes || {},
        language: data.language || 'en',
        token: generateToken(),
      },
    });
  }

  /**
   * Send invitations to participants
   */
  async sendInvitations(
    surveyId: string,
    participantIds: string[],
    options: {
      templateId?: string;
      customSubject?: string;
      customBody?: string;
      scheduleFor?: Date;
    }
  ): Promise<{ sent: number; failed: number }> {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        emailTemplates: {
          where: { type: 'INVITATION', isDefault: true },
        },
      },
    });

    if (!survey) throw new Error('Survey not found');

    const template = options.templateId
      ? await prisma.surveyEmailTemplate.findUnique({ where: { id: options.templateId } })
      : survey.emailTemplates[0];

    const subject = options.customSubject || template?.subject || `You're invited: ${survey.title}`;
    const bodyTemplate = options.customBody || template?.body || this.getDefaultInvitationTemplate();

    const participants = await prisma.participant.findMany({
      where: {
        id: { in: participantIds },
        status: 'PENDING',
      },
    });

    let sent = 0;
    let failed = 0;

    for (const participant of participants) {
      const surveyUrl = `${process.env.APP_URL}/survey/${surveyId}?token=${participant.token}`;

      const personalizedBody = this.applyMergeFields(bodyTemplate, {
        firstName: participant.firstName || '',
        lastName: participant.lastName || '',
        email: participant.email,
        surveyTitle: survey.title,
        surveyUrl,
        optOutUrl: `${process.env.APP_URL}/opt-out?email=${encodeURIComponent(participant.email)}`,
        ...((participant.attributes as object) || {}),
      });

      const personalizedSubject = this.applyMergeFields(subject, {
        firstName: participant.firstName || '',
        lastName: participant.lastName || '',
        surveyTitle: survey.title,
      });

      try {
        const trackingId = generateToken();
        const trackedBody = this.addEmailTracking(personalizedBody, trackingId);

        await sendEmail({
          to: participant.email,
          subject: personalizedSubject,
          html: trackedBody,
        });

        await prisma.$transaction([
          prisma.participant.update({
            where: { id: participant.id },
            data: {
              status: 'INVITED',
              invitedAt: new Date(),
            },
          }),
          prisma.participantInvitation.create({
            data: {
              participantId: participant.id,
              subject: personalizedSubject,
              body: personalizedBody,
              status: 'SENT',
              trackingId,
            },
          }),
        ]);

        sent++;
      } catch (error) {
        failed++;
        console.error(`Failed to send invitation to ${participant.email}:`, error);
      }
    }

    return { sent, failed };
  }

  /**
   * Send reminders to non-respondents
   */
  async sendReminders(
    surveyId: string,
    options: {
      reminderNumber: 1 | 2 | 3;
      onlyIfNoReminder?: boolean;
    }
  ): Promise<{ sent: number; failed: number }> {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        emailTemplates: {
          where: { type: `REMINDER_${options.reminderNumber}` as any },
        },
      },
    });

    if (!survey) throw new Error('Survey not found');

    // Find participants who were invited but haven't completed
    const query: any = {
      surveyId,
      status: { in: ['INVITED', 'STARTED'] },
    };

    if (options.onlyIfNoReminder) {
      query.reminders = {
        none: { reminderNumber: options.reminderNumber },
      };
    }

    const participants = await prisma.participant.findMany({
      where: query,
      include: { reminders: true },
    });

    let sent = 0;
    let failed = 0;

    // Similar logic to sendInvitations but with reminder template
    // ...implementation...

    return { sent, failed };
  }

  /**
   * Validate token and get participant
   */
  async validateToken(
    surveyId: string,
    token: string
  ): Promise<{
    valid: boolean;
    participant?: Participant;
    error?: string;
  }> {
    const participant = await prisma.participant.findFirst({
      where: { surveyId, token },
    });

    if (!participant) {
      return { valid: false, error: 'Invalid token' };
    }

    if (participant.status === 'OPTED_OUT') {
      return { valid: false, error: 'You have opted out of this survey' };
    }

    if (participant.status === 'COMPLETED') {
      const survey = await prisma.survey.findUnique({
        where: { id: surveyId },
        select: { participantTokenMode: true },
      });

      if (survey?.participantTokenMode === 'SINGLE_USE') {
        return { valid: false, error: 'You have already completed this survey' };
      }
    }

    if (participant.validUntil && participant.validUntil < new Date()) {
      await prisma.participant.update({
        where: { id: participant.id },
        data: { status: 'EXPIRED' },
      });
      return { valid: false, error: 'This invitation has expired' };
    }

    if (participant.tokenUsageLimit > 0 && participant.tokenUsageCount >= participant.tokenUsageLimit) {
      return { valid: false, error: 'Token usage limit reached' };
    }

    return { valid: true, participant };
  }

  /**
   * Mark participant as started
   */
  async markStarted(participantId: string): Promise<void> {
    await prisma.participant.update({
      where: { id: participantId },
      data: {
        status: 'STARTED',
        startedAt: new Date(),
        tokenUsageCount: { increment: 1 },
      },
    });
  }

  /**
   * Mark participant as completed and link response
   */
  async markCompleted(participantId: string, responseId: string): Promise<void> {
    await prisma.participant.update({
      where: { id: participantId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        responseId,
      },
    });
  }

  /**
   * Process opt-out request
   */
  async processOptOut(
    email: string,
    options: { surveyId?: string; global: boolean; reason?: string }
  ): Promise<void> {
    const normalizedEmail = email.toLowerCase();

    if (options.global) {
      await prisma.globalOptOut.upsert({
        where: { email: normalizedEmail },
        create: { email: normalizedEmail, reason: options.reason },
        update: { reason: options.reason },
      });

      // Update all pending participants for this email
      await prisma.participant.updateMany({
        where: {
          email: normalizedEmail,
          status: { in: ['PENDING', 'INVITED'] },
        },
        data: { status: 'OPTED_OUT', optedOutAt: new Date() },
      });
    } else if (options.surveyId) {
      await prisma.participant.updateMany({
        where: {
          surveyId: options.surveyId,
          email: normalizedEmail,
        },
        data: { status: 'OPTED_OUT', optedOutAt: new Date() },
      });
    }
  }

  /**
   * Get participant statistics for a survey
   */
  async getStatistics(surveyId: string): Promise<{
    total: number;
    byStatus: Record<ParticipantStatus, number>;
    responseRate: number;
    averageTimeToComplete: number | null;
  }> {
    const participants = await prisma.participant.groupBy({
      by: ['status'],
      where: { surveyId },
      _count: true,
    });

    const byStatus = Object.fromEntries(
      Object.values(ParticipantStatus).map(status => [
        status,
        participants.find(p => p.status === status)?._count || 0,
      ])
    ) as Record<ParticipantStatus, number>;

    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    const invited = byStatus.INVITED + byStatus.STARTED + byStatus.COMPLETED;
    const responseRate = invited > 0 ? (byStatus.COMPLETED / invited) * 100 : 0;

    // Calculate average completion time
    const completedParticipants = await prisma.participant.findMany({
      where: {
        surveyId,
        status: 'COMPLETED',
        startedAt: { not: null },
        completedAt: { not: null },
      },
      select: { startedAt: true, completedAt: true },
    });

    let averageTimeToComplete = null;
    if (completedParticipants.length > 0) {
      const totalTime = completedParticipants.reduce((sum, p) => {
        return sum + (p.completedAt!.getTime() - p.startedAt!.getTime());
      }, 0);
      averageTimeToComplete = totalTime / completedParticipants.length / 1000; // seconds
    }

    return { total, byStatus, responseRate, averageTimeToComplete };
  }

  // Helper methods
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private applyMergeFields(template: string, data: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
  }

  private addEmailTracking(html: string, trackingId: string): string {
    const trackingPixel = `<img src="${process.env.APP_URL}/api/track/open/${trackingId}" width="1" height="1" style="display:none" />`;
    return html.replace('</body>', `${trackingPixel}</body>`);
  }

  private getDefaultInvitationTemplate(): string {
    return `
      <h2>You're invited to participate in a survey</h2>
      <p>Dear {{firstName}},</p>
      <p>You have been invited to participate in: <strong>{{surveyTitle}}</strong></p>
      <p><a href="{{surveyUrl}}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:6px;">Take Survey</a></p>
      <p>If the button doesn't work, copy and paste this link: {{surveyUrl}}</p>
      <hr />
      <p style="font-size:12px;color:#666;">
        If you don't want to receive survey invitations, <a href="{{optOutUrl}}">click here to opt out</a>.
      </p>
    `;
  }
}

export const participantService = new ParticipantService();
```

### 3. API Endpoints

**File: `backend/src/routes/participantRoutes.ts`**

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { participantService } from '../services/participantService';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get participants for a survey
router.get('/surveys/:surveyId/participants', authenticate, async (req, res) => {
  const { page = 1, limit = 50, status, search } = req.query;

  const where: any = { surveyId: req.params.surveyId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { email: { contains: search as string, mode: 'insensitive' } },
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const [participants, total] = await Promise.all([
    prisma.participant.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        invitations: { orderBy: { sentAt: 'desc' }, take: 1 },
        reminders: { orderBy: { sentAt: 'desc' }, take: 1 },
      },
    }),
    prisma.participant.count({ where }),
  ]);

  res.json({
    participants,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// Get participant statistics
router.get('/surveys/:surveyId/participants/stats', authenticate, async (req, res) => {
  const stats = await participantService.getStatistics(req.params.surveyId);
  res.json(stats);
});

// Add single participant
router.post('/surveys/:surveyId/participants', authenticate, async (req, res) => {
  try {
    const participant = await participantService.addParticipant(
      req.params.surveyId,
      req.body
    );
    res.status(201).json(participant);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Import participants from CSV
router.post(
  '/surveys/:surveyId/participants/import',
  authenticate,
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const options = JSON.parse(req.body.options || '{}');
    const result = await participantService.importFromCSV(
      req.params.surveyId,
      req.file.buffer.toString('utf-8'),
      {
        hasHeader: options.hasHeader ?? true,
        emailColumn: options.emailColumn ?? 0,
        firstNameColumn: options.firstNameColumn,
        lastNameColumn: options.lastNameColumn,
        attributeColumns: options.attributeColumns,
        skipDuplicates: options.skipDuplicates ?? true,
      }
    );

    res.json(result);
  }
);

// Export participants
router.get('/surveys/:surveyId/participants/export', authenticate, async (req, res) => {
  const participants = await prisma.participant.findMany({
    where: { surveyId: req.params.surveyId },
    include: { response: { select: { completedAt: true } } },
  });

  // Generate CSV
  const headers = ['Email', 'First Name', 'Last Name', 'Status', 'Invited At', 'Completed At', 'Token'];
  const rows = participants.map(p => [
    p.email,
    p.firstName || '',
    p.lastName || '',
    p.status,
    p.invitedAt?.toISOString() || '',
    p.completedAt?.toISOString() || '',
    p.token,
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=participants-${req.params.surveyId}.csv`);
  res.send(csv);
});

// Send invitations
router.post('/surveys/:surveyId/participants/invite', authenticate, async (req, res) => {
  const { participantIds, templateId, customSubject, customBody } = req.body;

  const result = await participantService.sendInvitations(
    req.params.surveyId,
    participantIds,
    { templateId, customSubject, customBody }
  );

  res.json(result);
});

// Send reminders
router.post('/surveys/:surveyId/participants/remind', authenticate, async (req, res) => {
  const { reminderNumber, onlyIfNoReminder } = req.body;

  const result = await participantService.sendReminders(req.params.surveyId, {
    reminderNumber,
    onlyIfNoReminder,
  });

  res.json(result);
});

// Validate token (public endpoint)
router.get('/surveys/:surveyId/validate-token', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  const result = await participantService.validateToken(
    req.params.surveyId,
    token as string
  );

  res.json(result);
});

// Delete participant
router.delete('/participants/:participantId', authenticate, async (req, res) => {
  await prisma.participant.delete({
    where: { id: req.params.participantId },
  });
  res.json({ success: true });
});

// Opt-out endpoint (public)
router.post('/opt-out', async (req, res) => {
  const { email, surveyId, global, reason } = req.body;

  await participantService.processOptOut(email, { surveyId, global, reason });

  res.json({
    success: true,
    message: global
      ? 'You have been removed from all future surveys'
      : 'You have been removed from this survey',
  });
});

// Email tracking endpoints
router.get('/track/open/:trackingId', async (req, res) => {
  const { trackingId } = req.params;

  await prisma.participantInvitation.update({
    where: { trackingId },
    data: { openedAt: new Date(), status: 'OPENED' },
  }).catch(() => {}); // Ignore if not found

  // Return 1x1 transparent GIF
  const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.setHeader('Content-Type', 'image/gif');
  res.send(gif);
});

export default router;
```

### 4. Frontend: Participant Manager

**File: `frontend/src/components/survey/ParticipantManager.tsx`**

```typescript
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Upload, Send, Bell, Download, Trash2, Search,
  CheckCircle, Clock, AlertCircle, XCircle
} from 'lucide-react';
import { api } from '@/lib/api';

interface ParticipantManagerProps {
  surveyId: string;
}

export function ParticipantManager({ surveyId }: ParticipantManagerProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['participants', surveyId, page, statusFilter, search],
    queryFn: () =>
      api.get(`/surveys/${surveyId}/participants`, {
        params: { page, status: statusFilter || undefined, search: search || undefined },
      }).then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['participant-stats', surveyId],
    queryFn: () => api.get(`/surveys/${surveyId}/participants/stats`).then(r => r.data),
  });

  const inviteMutation = useMutation({
    mutationFn: (participantIds: string[]) =>
      api.post(`/surveys/${surveyId}/participants/invite`, { participantIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants', surveyId] });
      queryClient.invalidateQueries({ queryKey: ['participant-stats', surveyId] });
      setSelectedIds([]);
    },
  });

  const statusIcons = {
    PENDING: <Clock className="w-4 h-4 text-gray-400" />,
    INVITED: <Send className="w-4 h-4 text-blue-500" />,
    STARTED: <Clock className="w-4 h-4 text-yellow-500" />,
    COMPLETED: <CheckCircle className="w-4 h-4 text-green-500" />,
    OPTED_OUT: <XCircle className="w-4 h-4 text-red-500" />,
    BOUNCED: <AlertCircle className="w-4 h-4 text-red-500" />,
    EXPIRED: <AlertCircle className="w-4 h-4 text-gray-400" />,
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === data?.participants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data?.participants.map((p: any) => p.id) || []);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold">{stats?.total || 0}</div>
          <div className="text-sm text-gray-600">Total Participants</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {(stats?.byStatus?.INVITED || 0) + (stats?.byStatus?.STARTED || 0)}
          </div>
          <div className="text-sm text-gray-600">Invited</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {stats?.byStatus?.COMPLETED || 0}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold">
            {stats?.responseRate?.toFixed(1) || 0}%
          </div>
          <div className="text-sm text-gray-600">Response Rate</div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between bg-white border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search participants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="INVITED">Invited</option>
            <option value="STARTED">Started</option>
            <option value="COMPLETED">Completed</option>
            <option value="OPTED_OUT">Opted Out</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
            onClick={() => {/* Open import modal */}}
          >
            <Upload className="w-4 h-4" />
            Import
          </button>

          <button
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
            onClick={() => window.open(`/api/surveys/${surveyId}/participants/export`)}
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          {selectedIds.length > 0 && (
            <>
              <button
                onClick={() => inviteMutation.mutate(selectedIds)}
                disabled={inviteMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md"
              >
                <Send className="w-4 h-4" />
                Send Invites ({selectedIds.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === data?.participants.length && data?.participants.length > 0}
                  onChange={selectAll}
                />
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium">Email</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Invited</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Completed</th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {data?.participants.map((participant: any) => (
              <tr key={participant.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(participant.id)}
                    onChange={() => toggleSelect(participant.id)}
                  />
                </td>
                <td className="px-4 py-3 text-sm">{participant.email}</td>
                <td className="px-4 py-3 text-sm">
                  {[participant.firstName, participant.lastName].filter(Boolean).join(' ') || '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {statusIcons[participant.status as keyof typeof statusIcons]}
                    <span className="text-sm capitalize">
                      {participant.status.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {participant.invitedAt
                    ? new Date(participant.invitedAt).toLocaleDateString()
                    : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {participant.completedAt
                    ? new Date(participant.completedAt).toLocaleDateString()
                    : '-'}
                </td>
                <td className="px-4 py-3">
                  <button className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data?.pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, data.pagination.total)} of {data.pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pagination.pages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] Can add individual participants with email and attributes
- [ ] Can import participants from CSV/Excel
- [ ] Can export participant list with status
- [ ] Unique tokens generated for each participant
- [ ] Token validation works correctly
- [ ] Single-use tokens prevent duplicate responses
- [ ] Can send email invitations with personalized links
- [ ] Can customize invitation email template
- [ ] Can send reminders to non-respondents
- [ ] Track invitation delivery status
- [ ] Track email opens and clicks
- [ ] Link responses to participants
- [ ] Participant status updates automatically
- [ ] Global opt-out prevents future invitations
- [ ] Per-survey opt-out works correctly
- [ ] Statistics dashboard shows response rates
- [ ] Search and filter participants
- [ ] Bulk actions (invite, delete) work
- [ ] Works with anonymous mode (validate token but don't link)
- [ ] GDPR-compliant data handling
- [ ] Unit tests for token validation
- [ ] Integration tests for invitation flow

---

## Files to Create/Modify

### New Files
- `backend/src/services/participantService.ts`
- `backend/src/routes/participantRoutes.ts`
- `frontend/src/components/survey/ParticipantManager.tsx`
- `frontend/src/components/survey/ParticipantImport.tsx`
- `frontend/src/components/survey/EmailTemplateEditor.tsx`
- `frontend/src/pages/OptOut.tsx`

### Modified Files
- `backend/prisma/schema.prisma`
- `backend/src/routes/index.ts`
- `backend/src/routes/responseRoutes.ts` - Check token on submit
- `frontend/src/pages/SurveyBuilder.tsx` - Add participants tab
- `frontend/src/pages/SurveyTake.tsx` - Handle token parameter

---

## Dependencies

- Working SMTP configuration (Issue relates to email)
- Issue #001 (i18n) - Email templates need translation

---

## Security Considerations

- Tokens must be unguessable (use cryptographically secure random)
- Rate limit invitation sending
- Validate email addresses before sending
- Sanitize CSV imports
- Respect opt-outs strictly (legal requirement)
- Log all email sends for audit
