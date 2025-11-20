/**
 * Download Access Request Routes
 *
 * Handles download access requests for pre-monetization audience building
 * Users must subscribe to YouTube and follow Instagram to get download access
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();

// Validation schema for access requests
const accessRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  githubUsername: z.string().min(1, 'GitHub username is required').max(39), // GitHub max length
  fullName: z.string().optional(),
  youtubeSubscribed: z.boolean(),
  instagramFollowed: z.boolean(),
  proofScreenshotUrl: z.string().url().optional(),
  referralSource: z.string().optional()
});

/**
 * Submit download access request
 * POST /api/download-access/request
 */
router.post('/request', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = accessRequestSchema.parse(req.body);

    // Check if request already exists
    const existing = await prisma.downloadAccessRequest.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { githubUsername: validatedData.githubUsername }
        ]
      }
    });

    if (existing) {
      if (existing.status === 'APPROVED' || existing.status === 'INVITED') {
        return res.status(400).json({
          error: 'Access request already approved',
          message: 'You already have access! Check your email for instructions.'
        });
      }

      if (existing.status === 'PENDING') {
        return res.status(400).json({
          error: 'Request already submitted',
          message: 'Your request is being reviewed. We\'ll notify you via email.'
        });
      }
    }

    // Verify both social media confirmations are checked
    if (!validatedData.youtubeSubscribed || !validatedData.instagramFollowed) {
      return res.status(400).json({
        error: 'Social media verification required',
        message: 'Please subscribe to YouTube and follow Instagram to continue.'
      });
    }

    // Verify GitHub username exists
    try {
      await axios.get(`https://api.github.com/users/${validatedData.githubUsername}`);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid GitHub username',
        message: 'GitHub user not found. Please check your username.'
      });
    }

    // Create access request
    const accessRequest = await prisma.downloadAccessRequest.create({
      data: {
        email: validatedData.email,
        githubUsername: validatedData.githubUsername,
        fullName: validatedData.fullName,
        youtubeSubscribed: validatedData.youtubeSubscribed,
        instagramFollowed: validatedData.instagramFollowed,
        proofScreenshotUrl: validatedData.proofScreenshotUrl,
        referralSource: validatedData.referralSource,
        ipAddress: req.ip || req.headers['x-forwarded-for'] as string,
        userAgent: req.headers['user-agent']
      }
    });

    console.log(`✅ New download access request: ${accessRequest.email} (${accessRequest.githubUsername})`);

    res.status(201).json({
      message: 'Request submitted successfully!',
      data: {
        id: accessRequest.id,
        status: accessRequest.status,
        email: accessRequest.email
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Error creating access request:', error);
    res.status(500).json({
      error: 'Failed to submit request',
      message: 'Please try again later.'
    });
  }
});

/**
 * Get all access requests (admin only)
 * GET /api/download-access/requests
 */
router.get('/requests', async (req: Request, res: Response) => {
  try {
    // TODO: Add authentication middleware
    // For now, this is open (secure this before production!)

    const status = req.query.status as string | undefined;

    const requests = await prisma.downloadAccessRequest.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to latest 100
    });

    res.json({
      requests,
      total: requests.length
    });
  } catch (error) {
    console.error('Error fetching access requests:', error);
    res.status(500).json({
      error: 'Failed to fetch requests'
    });
  }
});

/**
 * Get single access request
 * GET /api/download-access/requests/:id
 */
router.get('/requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const request = await prisma.downloadAccessRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({
        error: 'Request not found'
      });
    }

    res.json({ request });
  } catch (error) {
    console.error('Error fetching access request:', error);
    res.status(500).json({
      error: 'Failed to fetch request'
    });
  }
});

/**
 * Approve access request (admin only)
 * POST /api/download-access/requests/:id/approve
 */
router.post('/requests/:id/approve', async (req: Request, res: Response) => {
  try {
    // TODO: Add authentication middleware
    const { id } = req.params;
    const { note } = req.body;

    const request = await prisma.downloadAccessRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({
        error: 'Request not found'
      });
    }

    // Update status
    const updated = await prisma.downloadAccessRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        statusNote: note,
        reviewedAt: new Date()
        // reviewedBy: req.user.id // TODO: Add when auth is implemented
      }
    });

    console.log(`✅ Approved access request: ${updated.email} (${updated.githubUsername})`);

    // TODO: Send approval email
    // TODO: Invite to GitHub repo

    res.json({
      message: 'Request approved successfully',
      request: updated
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({
      error: 'Failed to approve request'
    });
  }
});

/**
 * Reject access request (admin only)
 * POST /api/download-access/requests/:id/reject
 */
router.post('/requests/:id/reject', async (req: Request, res: Response) => {
  try {
    // TODO: Add authentication middleware
    const { id } = req.params;
    const { note } = req.body;

    const request = await prisma.downloadAccessRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({
        error: 'Request not found'
      });
    }

    // Update status
    const updated = await prisma.downloadAccessRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        statusNote: note,
        reviewedAt: new Date()
        // reviewedBy: req.user.id // TODO: Add when auth is implemented
      }
    });

    console.log(`❌ Rejected access request: ${updated.email} (${updated.githubUsername})`);

    // TODO: Send rejection email

    res.json({
      message: 'Request rejected',
      request: updated
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({
      error: 'Failed to reject request'
    });
  }
});

/**
 * Send GitHub invitation
 * POST /api/download-access/requests/:id/invite
 */
router.post('/requests/:id/invite', async (req: Request, res: Response) => {
  try {
    // TODO: Add authentication middleware
    const { id } = req.params;

    const request = await prisma.downloadAccessRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({
        error: 'Request not found'
      });
    }

    if (request.status !== 'APPROVED') {
      return res.status(400).json({
        error: 'Request must be approved first'
      });
    }

    // TODO: Implement GitHub invitation
    // This will require GitHub token with repo admin permissions
    // See: https://docs.github.com/en/rest/collaborators/invitations

    const updated = await prisma.downloadAccessRequest.update({
      where: { id },
      data: {
        status: 'INVITED',
        githubInviteSent: true,
        githubInvitedAt: new Date()
      }
    });

    console.log(`📧 Sent GitHub invite to: ${updated.githubUsername}`);

    res.json({
      message: 'GitHub invitation sent',
      request: updated
    });
  } catch (error) {
    console.error('Error sending GitHub invite:', error);
    res.status(500).json({
      error: 'Failed to send GitHub invitation'
    });
  }
});

/**
 * Get request statistics (admin only)
 * GET /api/download-access/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [total, pending, approved, rejected, invited] = await Promise.all([
      prisma.downloadAccessRequest.count(),
      prisma.downloadAccessRequest.count({ where: { status: 'PENDING' } }),
      prisma.downloadAccessRequest.count({ where: { status: 'APPROVED' } }),
      prisma.downloadAccessRequest.count({ where: { status: 'REJECTED' } }),
      prisma.downloadAccessRequest.count({ where: { status: 'INVITED' } })
    ]);

    res.json({
      total,
      pending,
      approved,
      rejected,
      invited
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics'
    });
  }
});

export default router;
