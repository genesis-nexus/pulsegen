import { Router, RequestHandler } from 'express';
import { userController } from '../controllers/userController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Protect all routes with authentication and admin requirement
router.use(authenticate as RequestHandler, requireAdmin as RequestHandler);

router.get('/', userController.getAll as unknown as RequestHandler);
router.put('/:id/role', userController.updateRole as unknown as RequestHandler);

export default router;
