import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import SurveyService from '../services/surveyService';
import {
  createSurveySchema,
  updateSurveySchema,
  publishSurveySchema,
  createQuestionSchema,
  updateQuestionSchema,
  createLogicSchema,
  updateLogicSchema,
} from '../utils/validators';

export class SurveyController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createSurveySchema.parse(req.body);
      const survey = await SurveyService.create(req.user!.id, data);

      res.status(201).json({
        success: true,
        data: survey,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, workspaceId } = req.query;

      const surveys = await SurveyService.findAll(req.user!.id, {
        status: status as any,
        workspaceId: workspaceId as string,
      });

      res.json({
        success: true,
        data: surveys,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const survey = await SurveyService.findById(id, req.user?.id);

      res.json({
        success: true,
        data: survey,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const survey = await SurveyService.findById(slug);

      res.json({
        success: true,
        data: survey,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateSurveySchema.parse(req.body);
      const survey = await SurveyService.update(id, req.user!.id, data);

      res.json({
        success: true,
        data: survey,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await SurveyService.delete(id, req.user!.id);

      res.json({
        success: true,
        message: 'Survey deleted',
      });
    } catch (error) {
      next(error);
    }
  }

  static async duplicate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const survey = await SurveyService.duplicate(id, req.user!.id);

      res.status(201).json({
        success: true,
        data: survey,
      });
    } catch (error) {
      next(error);
    }
  }

  static async publish(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = publishSurveySchema.parse(req.body);
      const survey = await SurveyService.publish(id, req.user!.id, status);

      res.json({
        success: true,
        data: survey,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = createQuestionSchema.parse(req.body);
      const question = await SurveyService.addQuestion(id, req.user!.id, data);

      res.status(201).json({
        success: true,
        data: question,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { questionId } = req.params;
      const data = updateQuestionSchema.parse(req.body);
      const question = await SurveyService.updateQuestion(
        questionId,
        req.user!.id,
        data
      );

      res.json({
        success: true,
        data: question,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { questionId } = req.params;
      await SurveyService.deleteQuestion(questionId, req.user!.id);

      res.json({
        success: true,
        message: 'Question deleted',
      });
    } catch (error) {
      next(error);
    }
  }

  static async reorderQuestions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { questionIds } = req.body;

      await SurveyService.reorderQuestions(id, req.user!.id, questionIds);

      res.json({
        success: true,
        message: 'Questions reordered',
      });
    } catch (error) {
      next(error);
    }
  }

  // Logic methods
  static async addLogic(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = createLogicSchema.parse(req.body);
      const logic = await SurveyService.addLogic(id, req.user!.id, data);

      res.status(201).json({
        success: true,
        data: logic,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLogic(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const logic = await SurveyService.getLogicForSurvey(id, req.user?.id);

      res.json({
        success: true,
        data: logic,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateLogic(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { logicId } = req.params;
      const data = updateLogicSchema.parse(req.body);
      const logic = await SurveyService.updateLogic(logicId, req.user!.id, data);

      res.json({
        success: true,
        data: logic,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteLogic(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { logicId } = req.params;
      await SurveyService.deleteLogic(logicId, req.user!.id);

      res.json({
        success: true,
        message: 'Logic rule deleted',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default SurveyController;
