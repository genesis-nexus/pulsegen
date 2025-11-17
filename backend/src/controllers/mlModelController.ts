import { Request, Response } from 'express';
import { mlModelService } from '../services/mlModelService';

export const mlModelController = {
  async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { status, surveyId, toolConfigId } = req.query;

      const models = await mlModelService.getAllModels(userId, {
        status: status as any,
        surveyId: surveyId as string,
        toolConfigId: toolConfigId as string,
      });

      res.json({
        success: true,
        data: models,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const model = await mlModelService.getModel(id, userId);

      res.json({
        success: true,
        data: model,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const model = await mlModelService.createModel(userId, req.body);

      res.status(201).json({
        success: true,
        data: model,
        message: 'Model created and training started',
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const model = await mlModelService.updateModel(id, userId, req.body);

      res.json({
        success: true,
        data: model,
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      await mlModelService.deleteModel(id, userId);

      res.json({
        success: true,
        message: 'Model deleted successfully',
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async archive(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const model = await mlModelService.archiveModel(id, userId);

      res.json({
        success: true,
        data: model,
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async predict(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const prediction = await mlModelService.predict(userId, {
        modelId: id,
        ...req.body,
      });

      res.json({
        success: true,
        data: prediction,
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async batchPredict(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { inputs } = req.body;

      if (!Array.isArray(inputs)) {
        return res.status(400).json({
          success: false,
          message: 'inputs must be an array',
        });
      }

      const predictions = await mlModelService.batchPredict(userId, id, inputs);

      res.json({
        success: true,
        data: predictions,
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async getPredictions(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { surveyId, responseId, limit } = req.query;

      const predictions = await mlModelService.getPredictions(id, userId, {
        surveyId: surveyId as string,
        responseId: responseId as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({
        success: true,
        data: predictions,
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async getStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const stats = await mlModelService.getModelStats(id, userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }
  },
};
