import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import ResponseService from '../services/responseService';
import { submitResponseSchema } from '../utils/validators';

export class ResponseController {
  static async submit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.params;
      const data = submitResponseSchema.parse(req.body);

      const response = await ResponseService.submit(
        surveyId,
        data,
        req.ip,
        req.headers['user-agent']
      );

      res.status(201).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const response = await ResponseService.getById(id);

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBySurvey(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { surveyId } = req.params;
      const { isComplete, startDate, endDate } = req.query;

      const responses = await ResponseService.getBySurvey(
        surveyId,
        req.user!.id,
        {
          isComplete: isComplete === 'true',
          startDate: startDate as string,
          endDate: endDate as string,
        }
      );

      res.json({
        success: true,
        data: responses,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ResponseService.delete(id, req.user!.id);

      res.json({
        success: true,
        message: 'Response deleted',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ResponseController;
