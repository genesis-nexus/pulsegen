import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { participantService } from '../services/participantService';
import { prisma } from '../config/database';
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

// Send invitations
router.post('/surveys/:surveyId/participants/invite', authenticate, async (req, res) => {
    try {
        const { participantIds, templateId, customSubject, customBody, scheduleFor } = req.body;

        if (!participantIds || !Array.isArray(participantIds)) {
            return res.status(400).json({ error: 'participantIds must be an array' });
        }

        const result = await participantService.sendInvitations(
            req.params.surveyId,
            participantIds,
            { templateId, customSubject, customBody, scheduleFor }
        );

        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Send reminders
router.post('/surveys/:surveyId/participants/remind', authenticate, async (req, res) => {
    try {
        const { reminderNumber, onlyIfNoReminder } = req.body;

        const result = await participantService.sendReminders(
            req.params.surveyId,
            { reminderNumber, onlyIfNoReminder }
        );

        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
