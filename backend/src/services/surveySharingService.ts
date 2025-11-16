import { PrismaClient, SurveyVisibility } from '@prisma/client';
import bcrypt from 'bcrypt';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export interface SurveyVisibilityInput {
  visibility: SurveyVisibility;
  password?: string;
}

export const surveySharingService = {
  async updateVisibility(surveyId: string, userId: string, data: SurveyVisibilityInput) {
    // Check ownership
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey) {
      throw new AppError(404, 'Survey not found');
    }

    if (survey.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    const updateData: any = {
      visibility: data.visibility,
    };

    // Handle password for PASSWORD_PROTECTED visibility
    if (data.visibility === SurveyVisibility.PASSWORD_PROTECTED) {
      if (!data.password) {
        throw new AppError(400, 'Password is required for password-protected surveys');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateData.password = hashedPassword;
    } else {
      // Clear password if visibility is not PASSWORD_PROTECTED
      updateData.password = null;
    }

    const updated = await prisma.survey.update({
      where: { id: surveyId },
      data: updateData,
    });

    return updated;
  },

  async verifyPassword(surveyId: string, password: string): Promise<boolean> {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey) {
      throw new AppError(404, 'Survey not found');
    }

    if (survey.visibility !== SurveyVisibility.PASSWORD_PROTECTED || !survey.password) {
      throw new AppError(400, 'Survey is not password protected');
    }

    return await bcrypt.compare(password, survey.password);
  },

  async generateShareableLink(surveyId: string, userId: string) {
    // Check ownership
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey) {
      throw new AppError(404, 'Survey not found');
    }

    if (survey.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    // Generate a unique shareable link code
    const linkCode = crypto.randomBytes(8).toString('hex');

    const updated = await prisma.survey.update({
      where: { id: surveyId },
      data: {
        shareableLink: linkCode,
      },
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/s/${linkCode}`;

    return {
      linkCode,
      shareUrl,
      survey: updated,
    };
  },

  async generateQRCode(surveyId: string, userId: string) {
    // Check ownership
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey) {
      throw new AppError(404, 'Survey not found');
    }

    if (survey.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    // Generate shareable link if not exists
    let linkCode = survey.shareableLink;
    if (!linkCode) {
      linkCode = crypto.randomBytes(8).toString('hex');
      await prisma.survey.update({
        where: { id: surveyId },
        data: {
          shareableLink: linkCode,
        },
      });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/s/${linkCode}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
    });

    return {
      qrCode: qrCodeDataUrl,
      shareUrl,
      linkCode,
    };
  },

  async generateEmbedCode(surveyId: string, userId: string, options?: {
    width?: string;
    height?: string;
  }) {
    // Check ownership
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey) {
      throw new AppError(404, 'Survey not found');
    }

    if (survey.createdBy !== userId) {
      throw new AppError(403, 'Access denied');
    }

    // Generate shareable link if not exists
    let linkCode = survey.shareableLink;
    if (!linkCode) {
      linkCode = crypto.randomBytes(8).toString('hex');
      await prisma.survey.update({
        where: { id: surveyId },
        data: {
          shareableLink: linkCode,
        },
      });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const embedUrl = `${baseUrl}/s/${linkCode}`;

    const width = options?.width || '100%';
    const height = options?.height || '600px';

    const embedCode = `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" style="border: 1px solid #e5e7eb; border-radius: 8px;"></iframe>`;

    // Update survey with embed code
    await prisma.survey.update({
      where: { id: surveyId },
      data: {
        embedCode,
      },
    });

    return {
      embedCode,
      embedUrl,
      linkCode,
    };
  },

  async getSurveyByShareLink(linkCode: string) {
    const survey = await prisma.survey.findFirst({
      where: { shareableLink: linkCode },
      include: {
        questions: {
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        pages: {
          include: {
            questions: {
              include: {
                options: {
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        theme: true,
      },
    });

    if (!survey) {
      throw new AppError(404, 'Survey not found');
    }

    // Check visibility
    if (survey.visibility === SurveyVisibility.PRIVATE) {
      throw new AppError(403, 'This survey is private');
    }

    return survey;
  },

  async checkSurveyAccess(surveyId: string, password?: string) {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey) {
      throw new AppError(404, 'Survey not found');
    }

    // Check visibility
    switch (survey.visibility) {
      case SurveyVisibility.PRIVATE:
        throw new AppError(403, 'This survey is private');

      case SurveyVisibility.PASSWORD_PROTECTED:
        if (!password) {
          throw new AppError(401, 'Password required');
        }

        if (!survey.password) {
          throw new AppError(400, 'Survey password not set');
        }

        const isValid = await bcrypt.compare(password, survey.password);
        if (!isValid) {
          throw new AppError(401, 'Invalid password');
        }
        break;

      case SurveyVisibility.UNLISTED:
      case SurveyVisibility.PUBLIC:
        // No additional checks needed
        break;
    }

    return { access: true };
  },
};
