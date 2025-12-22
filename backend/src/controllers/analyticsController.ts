import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import AnalyticsService from '../services/analyticsService';

export class AnalyticsController {
  static async getSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.params;
      const summary = await AnalyticsService.getSummary(surveyId, req.user!.id);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getQuestionAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.params;
      const { questionId } = req.query;

      const analytics = await AnalyticsService.getQuestionAnalytics(
        surveyId,
        req.user!.id,
        questionId as string
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInsights(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.params;
      const { type } = req.query;

      const insights = await AnalyticsService.getInsights(
        surveyId,
        req.user!.id,
        type as string
      );

      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCrossTabulation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.params;
      const { questionId1, questionId2 } = req.query;

      if (!questionId1 || !questionId2) {
        return res.status(400).json({
          success: false,
          message: 'Both questionId1 and questionId2 are required',
        });
      }

      const crosstab = await AnalyticsService.getCrossTabulation(
        surveyId,
        req.user!.id,
        questionId1 as string,
        questionId2 as string
      );

      res.json({
        success: true,
        data: crosstab,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSourceAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.params;
      const sources = await AnalyticsService.getSourceAnalytics(surveyId, req.user!.id);

      res.json({
        success: true,
        data: sources,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AnalyticsController;
