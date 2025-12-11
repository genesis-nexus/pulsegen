import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import AuthService from '../services/authService';
import { registerSchema, loginSchema } from '../utils/validators';

export class AuthController {
  static async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await AuthService.register(
        validatedData as { email: string; password: string; firstName?: string; lastName?: string },
        req.headers['user-agent'],
        req.ip
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await AuthService.login(
        validatedData as { email: string; password: string },
        req.headers['user-agent'],
        req.ip
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token required',
        });
      }

      const result = await AuthService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createApiKey(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const apiKey = await AuthService.createApiKey(req.user!.id, name);

      res.status(201).json({
        success: true,
        data: apiKey,
      });
    } catch (error) {
      next(error);
    }
  }

  static async revokeApiKey(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { keyId } = req.params;
      await AuthService.revokeApiKey(req.user!.id, keyId);

      res.json({
        success: true,
        message: 'API key revoked',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
