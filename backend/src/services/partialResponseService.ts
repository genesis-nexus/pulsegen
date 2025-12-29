import crypto from 'crypto';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { addDays } from 'date-fns';

// Generate a 6-character alphanumeric code
export function generateResumeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (0, O, 1, I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(crypto.randomInt(chars.length));
  }
  return code;
}

interface SendResumeEmailParams {
  email: string;
  name?: string;
  resumeUrl: string;
  resumeCode: string;
  surveyTitle: string;
  expiresAt: Date;
}

export async function sendResumeEmail({
  email,
  name,
  resumeUrl,
  resumeCode,
  surveyTitle,
  expiresAt,
}: SendResumeEmailParams) {
  const greeting = name ? `Hi ${name}` : 'Hi';
  const expiryText = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // For now, just log the email (will be integrated with email service later)
  console.log('===== RESUME EMAIL =====');
  console.log(`To: ${email}`);
  console.log(`Subject: Continue your survey: ${surveyTitle}`);
  console.log(`\n${greeting},\n`);
  console.log(`Your progress on "${surveyTitle}" has been saved.`);
  console.log(`You can continue where you left off anytime before ${expiryText}.\n`);
  console.log(`Resume URL: ${resumeUrl}`);
  console.log(`Resume Code: ${resumeCode}\n`);
  console.log('========================');

  // TODO: Integrate with actual email service (SMTP/SendGrid/etc)
  // const emailService = await import('./emailService');
  // await emailService.sendEmail({
  //   to: email,
  //   subject: `Continue your survey: ${surveyTitle}`,
  //   html: ...,
  //   text: ...
  // });
}

// Cleanup job for expired partial responses
export async function cleanupExpiredPartialResponses() {
  // Mark expired partial responses
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

  return {
    expired: result.count,
    deleted: deleted.count,
  };
}

// Save authenticated user's progress
export async function saveAuthenticatedProgress({
  userId,
  surveyId,
  answers,
  currentPageIndex,
  lastQuestionId,
  ipAddress,
  userAgent,
}: {
  userId: string;
  surveyId: string;
  answers: Record<string, any>;
  currentPageIndex: number;
  lastQuestionId?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  // Check if user already has a partial response for this survey
  const existing = await prisma.partialResponse.findFirst({
    where: {
      userId,
      surveyId,
      status: 'IN_PROGRESS',
    },
  });

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: { saveExpirationDays: true },
  });

  const expiresAt =
    survey?.saveExpirationDays && survey.saveExpirationDays > 0
      ? addDays(new Date(), survey.saveExpirationDays)
      : addDays(new Date(), 365 * 10);

  if (existing) {
    // Update existing
    return await prisma.partialResponse.update({
      where: { id: existing.id },
      data: {
        answers,
        currentPageIndex,
        lastQuestionId,
        lastSavedAt: new Date(),
      },
    });
  } else {
    // Create new
    return await prisma.partialResponse.create({
      data: {
        userId,
        surveyId,
        answers,
        currentPageIndex,
        lastQuestionId,
        expiresAt,
        ipAddress,
        userAgent,
        status: 'IN_PROGRESS',
      },
    });
  }
}

// Get authenticated user's progress
export async function getAuthenticatedProgress(userId: string, surveyId: string) {
  return await prisma.partialResponse.findFirst({
    where: {
      userId,
      surveyId,
      status: 'IN_PROGRESS',
      expiresAt: { gt: new Date() },
    },
    orderBy: {
      lastSavedAt: 'desc',
    },
  });
}

// Link anonymous partial response to authenticated user
export async function linkAnonymousToAuthenticated({
  resumeToken,
  userId,
}: {
  resumeToken: string;
  userId: string;
}) {
  const anonymousPartial = await prisma.partialResponse.findUnique({
    where: { resumeToken },
  });

  if (!anonymousPartial) {
    throw new AppError(404, 'Anonymous progress not found');
  }

  if (anonymousPartial.userId) {
    throw new AppError(400, 'Already linked to a user');
  }

  // Check if user already has progress for this survey
  const existingUserProgress = await prisma.partialResponse.findFirst({
    where: {
      userId,
      surveyId: anonymousPartial.surveyId,
      status: 'IN_PROGRESS',
    },
  });

  if (existingUserProgress) {
    // User already has progress - merge by keeping the most recent answers
    const mergedAnswers = {
      ...(existingUserProgress.answers as object),
      ...(anonymousPartial.answers as object),
    };

    const updated = await prisma.partialResponse.update({
      where: { id: existingUserProgress.id },
      data: {
        answers: mergedAnswers,
        currentPageIndex: Math.max(
          existingUserProgress.currentPageIndex,
          anonymousPartial.currentPageIndex
        ),
        lastSavedAt: new Date(),
      },
    });

    // Mark anonymous as abandoned
    await prisma.partialResponse.update({
      where: { id: anonymousPartial.id },
      data: { status: 'ABANDONED' },
    });

    return updated;
  } else {
    // Just link the anonymous partial to the user
    return await prisma.partialResponse.update({
      where: { id: anonymousPartial.id },
      data: {
        userId,
        respondentEmail: null, // Clear email since user is authenticated
        respondentName: null,
      },
    });
  }
}
