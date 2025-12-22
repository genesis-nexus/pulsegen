import { prisma } from '../config/database';
import EmailService from './emailService';
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
                if (error.code === 'P2002') {
                    if (options.skipDuplicates) {
                        skipped++;
                    } else {
                        errors.push(`Row ${i + 1}: Duplicate participant`);
                    }
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

                await EmailService.sendEmail({
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
            // Logic for "only if no reminder" would ideally check relations logic
            // but Prisma 'none' filter on relations might be heavy. 
            // Simplified: Just check if they haven't received THIS reminder level yet.
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

        // Default reminder template if none found
        const defaultSubject = `Reminder: ${survey.title}`;
        const defaultBody = `
      <h2>Reminder</h2>
      <p>Dear {{firstName}},</p>
      <p>This is a reminder to complete the survey: <strong>{{surveyTitle}}</strong></p>
      <p><a href="{{surveyUrl}}" style="padding:10px 20px;background:#3b82f6;color:white;text-decoration:none;border-radius:4px;">Complete Survey</a></p>
    `;

        const template = survey.emailTemplates[0];
        const subject = template?.subject || defaultSubject;
        const bodyTemplate = template?.body || defaultBody;

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
                await EmailService.sendEmail({
                    to: participant.email,
                    subject: personalizedSubject,
                    html: personalizedBody,
                });

                await prisma.participantReminder.create({
                    data: {
                        participantId: participant.id,
                        reminderNumber: options.reminderNumber,
                        scheduledFor: new Date(),
                        sentAt: new Date(),
                        status: 'SENT'
                    }
                });

                sent++;
            } catch (err) {
                failed++;
            }
        }

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
