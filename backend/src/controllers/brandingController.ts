import { Request, Response } from 'express';
import { brandingService } from '../services/brandingService';

export const brandingController = {
  async get(req: Request, res: Response) {
    try {
      const branding = await brandingService.getBranding();
      res.json({
        success: true,
        data: branding,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const branding = await brandingService.updateBranding(req.body);
      res.json({
        success: true,
        data: branding,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async reset(req: Request, res: Response) {
    try {
      const result = await brandingService.resetBranding();
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async uploadLogo(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const imageUrl = await brandingService.uploadImage(req.file, 'logo');

      // Update branding with new logo URL
      const branding = await brandingService.updateBranding({ logoUrl: imageUrl });

      res.json({
        success: true,
        data: {
          logoUrl: imageUrl,
          branding,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async uploadFavicon(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const imageUrl = await brandingService.uploadImage(req.file, 'favicon');

      // Update branding with new favicon URL
      const branding = await brandingService.updateBranding({ faviconUrl: imageUrl });

      res.json({
        success: true,
        data: {
          faviconUrl: imageUrl,
          branding,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async uploadBackground(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const imageUrl = await brandingService.uploadImage(req.file, 'background');

      // Update branding with new background URL
      const branding = await brandingService.updateBranding({ loginBgUrl: imageUrl });

      res.json({
        success: true,
        data: {
          loginBgUrl: imageUrl,
          branding,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async deleteImage(req: Request, res: Response) {
    try {
      const { type } = req.params; // logo, favicon, or background

      const branding = await brandingService.getBranding();
      let imageUrl: string | null = null;

      switch (type) {
        case 'logo':
          imageUrl = branding.logoUrl;
          break;
        case 'favicon':
          imageUrl = branding.faviconUrl;
          break;
        case 'background':
          imageUrl = branding.loginBgUrl;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid image type',
          });
      }

      if (imageUrl) {
        await brandingService.deleteImage(imageUrl);
        await brandingService.updateBranding({ [`${type}Url`]: null });
      }

      res.json({
        success: true,
        message: 'Image deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
};
