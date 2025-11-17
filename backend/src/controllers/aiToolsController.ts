import { Request, Response } from 'express';
import { aiToolsService } from '../services/aiToolsService';
import { AIToolType } from '@prisma/client';

export const aiToolsController = {
  async getAll(req: Request, res: Response) {
    try {
      const configs = await aiToolsService.getAllConfigs();
      res.json({
        success: true,
        data: configs,
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
      const { id } = req.params;
      const config = await aiToolsService.getConfig(id);

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Configuration not found',
        });
      }

      // Don't expose decrypted credentials in response
      res.json({
        success: true,
        data: {
          ...config,
          apiKey: config.apiKey ? '***ENCRYPTED***' : null,
          password: config.password ? '***ENCRYPTED***' : null,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async getAvailableTools(req: Request, res: Response) {
    res.json({
      success: true,
      data: [
        {
          type: AIToolType.MINDSDB,
          name: 'MindsDB',
          description: 'AI Database for automated ML predictions and time-series analysis',
          features: [
            'Automated ML model training',
            'Time-series forecasting',
            'Natural language to SQL',
            'Integration with multiple databases',
            'Real-time predictions',
          ],
          requiresEndpoint: true,
          requiresAuth: true,
          authTypes: ['api_key', 'username_password'],
          website: 'https://mindsdb.com',
        },
        {
          type: AIToolType.HUGGINGFACE,
          name: 'Hugging Face',
          description: 'Access to thousands of pre-trained ML models',
          features: [
            'NLP models (sentiment, classification, etc.)',
            'Computer vision models',
            'Audio models',
            'Pre-trained transformers',
          ],
          requiresEndpoint: true,
          requiresAuth: true,
          authTypes: ['api_key'],
          website: 'https://huggingface.co',
        },
        {
          type: AIToolType.TENSORFLOW,
          name: 'TensorFlow Serving',
          description: 'Serve TensorFlow models via REST or gRPC',
          features: [
            'Custom model deployment',
            'High-performance serving',
            'Model versioning',
          ],
          requiresEndpoint: true,
          requiresAuth: false,
          website: 'https://www.tensorflow.org/tfx/guide/serving',
        },
        {
          type: AIToolType.PYTORCH,
          name: 'PyTorch Serve',
          description: 'Serve PyTorch models for inference',
          features: [
            'Custom model deployment',
            'Multi-model serving',
            'Batch inference',
          ],
          requiresEndpoint: true,
          requiresAuth: false,
          website: 'https://pytorch.org/serve/',
        },
        {
          type: AIToolType.CUSTOM,
          name: 'Custom API',
          description: 'Connect to your own ML API endpoint',
          features: [
            'Flexible integration',
            'Custom authentication',
          ],
          requiresEndpoint: true,
          requiresAuth: true,
          authTypes: ['api_key', 'username_password', 'bearer_token'],
        },
      ],
    });
  },

  async create(req: Request, res: Response) {
    try {
      const config = await aiToolsService.createConfig(req.body);
      res.status(201).json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const config = await aiToolsService.updateConfig(id, req.body);
      res.json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await aiToolsService.deleteConfig(id);
      res.json({
        success: true,
        message: 'AI tool configuration deleted',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async testConnection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await aiToolsService.testConnection(id);
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
};
