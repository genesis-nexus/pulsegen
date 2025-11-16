import { Request, Response } from 'express';
import { surveySharingService } from '../services/surveySharingService';

export const surveySharingController = {
  async updateVisibility(req: Request, res: Response) {
    try {
      const { surveyId } = req.params;
      const userId = (req as any).user.id;

      const survey = await surveySharingService.updateVisibility(surveyId, userId, req.body);

      res.json({
        success: true,
        data: survey,
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async verifyPassword(req: Request, res: Response) {
    try {
      const { surveyId } = req.params;
      const { password } = req.body;

      const isValid = await surveySharingService.verifyPassword(surveyId, password);

      res.json({
        success: true,
        data: { valid: isValid },
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async generateShareableLink(req: Request, res: Response) {
    try {
      const { surveyId } = req.params;
      const userId = (req as any).user.id;

      const result = await surveySharingService.generateShareableLink(surveyId, userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async generateQRCode(req: Request, res: Response) {
    try {
      const { surveyId } = req.params;
      const userId = (req as any).user.id;

      const result = await surveySharingService.generateQRCode(surveyId, userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async generateEmbedCode(req: Request, res: Response) {
    try {
      const { surveyId } = req.params;
      const userId = (req as any).user.id;
      const { width, height } = req.body;

      const result = await surveySharingService.generateEmbedCode(surveyId, userId, {
        width,
        height,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async getSurveyByShareLink(req: Request, res: Response) {
    try {
      const { linkCode } = req.params;

      const survey = await surveySharingService.getSurveyByShareLink(linkCode);

      res.json({
        success: true,
        data: survey,
      });
    } catch (error: any) {
      res.status(error.statusCode || 404).json({
        success: false,
        message: error.message,
      });
    }
  },

  async checkAccess(req: Request, res: Response) {
    try {
      const { surveyId } = req.params;
      const { password } = req.body;

      const result = await surveySharingService.checkSurveyAccess(surveyId, password);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 403).json({
        success: false,
        message: error.message,
      });
    }
  },
};
