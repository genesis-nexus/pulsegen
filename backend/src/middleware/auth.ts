import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'Invalid token');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid token'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions'));
    }

    next();
  };
};

export const requireAdmin = authorize(UserRole.ADMIN);

export const apiKeyAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      throw new AppError(401, 'API key required');
    }

    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: { select: { id: true, email: true, role: true } } },
    });

    if (!key || !key.isActive) {
      throw new AppError(401, 'Invalid API key');
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsed: new Date() },
    });

    req.user = key.user;
    next();
  } catch (error) {
    next(error);
  }
};
