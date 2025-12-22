import crypto from 'crypto';
import { prisma } from '../config/database';

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
