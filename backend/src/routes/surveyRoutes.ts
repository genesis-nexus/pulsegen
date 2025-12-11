import { Router, RequestHandler } from 'express';
import SurveyController from '../controllers/surveyController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Survey CRUD
router.post('/', authenticate, SurveyController.create as unknown as RequestHandler);
router.get('/', authenticate, SurveyController.getAll as unknown as RequestHandler);
router.get('/:id', SurveyController.getById as unknown as RequestHandler);
router.put('/:id', authenticate, SurveyController.update as unknown as RequestHandler);
router.delete('/:id', authenticate, SurveyController.delete as unknown as RequestHandler);

// Survey actions
router.post('/:id/duplicate', authenticate, SurveyController.duplicate as unknown as RequestHandler);
router.post('/:id/publish', authenticate, SurveyController.publish as unknown as RequestHandler);

// Questions
router.post('/:id/questions', authenticate, SurveyController.addQuestion as unknown as RequestHandler);
router.put('/questions/:questionId', authenticate, SurveyController.updateQuestion as unknown as RequestHandler);
router.delete('/questions/:questionId', authenticate, SurveyController.deleteQuestion as unknown as RequestHandler);
router.post('/:id/questions/reorder', authenticate, SurveyController.reorderQuestions as unknown as RequestHandler);

// Logic rules
router.post('/:id/logic', authenticate, SurveyController.addLogic);
router.get('/:id/logic', SurveyController.getLogic);
router.put('/logic/:logicId', authenticate, SurveyController.updateLogic);
router.delete('/logic/:logicId', authenticate, SurveyController.deleteLogic);

export default router;
