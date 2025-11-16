import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import AIProviderService from '../services/aiProviderService';
import { z } from 'zod';
import { AIProvider } from '@prisma/client';

const addProviderSchema = z.object({
  provider: z.enum(['OPENAI', 'ANTHROPIC', 'GOOGLE', 'AZURE_OPENAI', 'COHERE', 'HUGGINGFACE', 'CUSTOM']),
  apiKey: z.string().min(1, 'API key is required'),
  modelName: z.string().optional(),
  endpoint: z.string().url().optional(),
  isDefault: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
});

const updateProviderSchema = z.object({
  apiKey: z.string().min(1).optional(),
  modelName: z.string().optional(),
  endpoint: z.string().url().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
});

export class AIProviderController {
  static async listProviders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const providers = await AIProviderService.listProviders(req.user!.id);

      res.json({
        success: true,
        data: providers,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAvailableProviders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const providers = AIProviderService.getAvailableProviders();

      res.json({
        success: true,
        data: providers,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addProvider(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = addProviderSchema.parse(req.body);

      const provider = await AIProviderService.addProvider(req.user!.id, data);

      res.status(201).json({
        success: true,
        data: provider,
        message: 'AI provider added successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProvider(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { provider } = req.params;
      const data = updateProviderSchema.parse(req.body);

      const updated = await AIProviderService.updateProvider(
        req.user!.id,
        provider as AIProvider,
        data
      );

      res.json({
        success: true,
        data: updated,
        message: 'AI provider updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProvider(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { provider } = req.params;

      await AIProviderService.deleteProvider(req.user!.id, provider as AIProvider);

      res.json({
        success: true,
        message: 'AI provider deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AIProviderController;
