import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const userController = {
    // Get all users (Admin only)
    getAll: async (_req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true,
                    provider: true,
                    createdAt: true,

                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            res.json({
                status: 'success',
                data: users,
            });
        } catch (error) {
            next(error);
        }
    },

    // Update user role (Admin only)
    updateRole: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const schema = z.object({
                role: z.nativeEnum(UserRole),
            });

            const validatedData = schema.parse(req.body);

            // Prevent changing own role for safety (optional, but good practice)
            if (req.user?.id === id) {
                throw new AppError(400, 'Cannot change your own role');
            }

            const user = await prisma.user.update({
                where: { id },
                data: { role: validatedData.role },
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            });

            res.json({
                status: 'success',
                data: user,
            });
        } catch (error) {
            next(error);
        }
    },
};
