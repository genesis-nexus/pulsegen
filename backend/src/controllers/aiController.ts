import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import AIService from '../services/aiService';
import SurveyService from '../services/surveyService';
import { generateSurveySchema, analyzeResponsesSchema } from '../utils/validators';

export class AIController {
  static async generateSurvey(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = generateSurveySchema.parse(req.body);

      const generated = await AIService.generateSurvey({
        userId: req.user!.id,
        prompt: data.prompt,
        questionCount: data.questionCount,
        includeLogic: data.includeLogic,
      });

      res.json({
        success: true,
        data: generated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async suggestQuestions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.params;

      const survey = await SurveyService.findById(surveyId, req.user!.id);

      const suggestions = await AIService.suggestQuestions(
        req.user!.id,
        {
          surveyTitle: survey.title,
          existingQuestions: survey.questions.map((q) => q.text),
          targetAudience: req.body.targetAudience,
        }
      );

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async optimizeQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { questionId } = req.params;
      const { text, type, options } = req.body;

      const optimized = await AIService.optimizeQuestion(
        req.user!.id,
        {
          text,
          type,
          options,
        }
      );

      res.json({
        success: true,
        data: optimized,
      });
    } catch (error) {
      next(error);
    }
  }

  static async analyzeSentiment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Text is required',
        });
      }

      const sentiment = await AIService.analyzeSentiment(req.user!.id, text);

      res.json({
        success: true,
        data: sentiment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.params;

      const survey = await SurveyService.findById(surveyId, req.user!.id);
      const analytics = await AnalyticsService.getSummary(surveyId, req.user!.id);
      const insights = await AnalyticsService.getInsights(surveyId, req.user!.id);

      const report = await AIService.generateReport(
        req.user!.id,
        {
          surveyTitle: survey.title,
          analytics,
          insights,
        }
      );

      res.json({
        success: true,
        data: {
          report,
          format: 'markdown',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

// Import AnalyticsService
import AnalyticsService from '../services/analyticsService';

export default AIController;
