import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const prisma = new PrismaClient();

export interface BrandingInput {
  platformName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  loginBgUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  customCss?: string;
  customJs?: string;
  footerText?: string;
  supportEmail?: string;
  termsUrl?: string;
  privacyUrl?: string;
  showPoweredBy?: boolean;
}

export const brandingService = {
  async getBranding() {
    let branding = await prisma.platformBranding.findFirst();

    if (!branding) {
      // Create default branding
      branding = await prisma.platformBranding.create({
        data: {
          platformName: 'PulseGen',
          primaryColor: '#3B82F6',
          secondaryColor: '#6B7280',
          accentColor: '#10B981',
          showPoweredBy: true,
        },
      });
    }

    return branding;
  },

  async updateBranding(data: BrandingInput) {
    let branding = await prisma.platformBranding.findFirst();

    if (!branding) {
      branding = await prisma.platformBranding.create({
        data: {
          platformName: data.platformName || 'PulseGen',
          logoUrl: data.logoUrl,
          faviconUrl: data.faviconUrl,
          loginBgUrl: data.loginBgUrl,
          primaryColor: data.primaryColor || '#3B82F6',
          secondaryColor: data.secondaryColor || '#6B7280',
          accentColor: data.accentColor || '#10B981',
          customCss: data.customCss,
          customJs: data.customJs,
          footerText: data.footerText,
          supportEmail: data.supportEmail,
          termsUrl: data.termsUrl,
          privacyUrl: data.privacyUrl,
          showPoweredBy: data.showPoweredBy ?? true,
        },
      });
    } else {
      branding = await prisma.platformBranding.update({
        where: { id: branding.id },
        data,
      });
    }

    return branding;
  },

  async resetBranding() {
    const branding = await prisma.platformBranding.findFirst();

    if (branding) {
      await prisma.platformBranding.update({
        where: { id: branding.id },
        data: {
          platformName: 'PulseGen',
          logoUrl: null,
          faviconUrl: null,
          loginBgUrl: null,
          primaryColor: '#3B82F6',
          secondaryColor: '#6B7280',
          accentColor: '#10B981',
          customCss: null,
          customJs: null,
          footerText: null,
          supportEmail: null,
          termsUrl: null,
          privacyUrl: null,
          showPoweredBy: true,
        },
      });
    }

    return { message: 'Branding reset to default' };
  },

  async uploadImage(file: Express.Multer.File, type: 'logo' | 'favicon' | 'background') {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'branding');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${type}-${timestamp}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Process image based on type
    let processedImage = sharp(file.buffer);

    switch (type) {
      case 'logo':
        // Resize logo to max 500x200 maintaining aspect ratio
        processedImage = processedImage.resize(500, 200, {
          fit: 'inside',
          withoutEnlargement: true,
        });
        break;

      case 'favicon':
        // Resize favicon to 32x32
        processedImage = processedImage.resize(32, 32, {
          fit: 'cover',
        });
        break;

      case 'background':
        // Resize background to max 1920x1080 maintaining aspect ratio
        processedImage = processedImage.resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true,
        });
        break;
    }

    // Save processed image
    await processedImage.toFile(filepath);

    // Return URL path
    return `/uploads/branding/${filename}`;
  },

  async deleteImage(imageUrl: string) {
    if (!imageUrl) return;

    const filepath = path.join(process.cwd(), imageUrl);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  },
};
