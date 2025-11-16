import { Router } from 'express';
import SurveyController from '../controllers/surveyController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Survey CRUD
router.post('/', authenticate, SurveyController.create);
router.get('/', authenticate, SurveyController.getAll);
router.get('/:id', SurveyController.getById);
router.put('/:id', authenticate, SurveyController.update);
router.delete('/:id', authenticate, SurveyController.delete);

// Survey actions
router.post('/:id/duplicate', authenticate, SurveyController.duplicate);
router.post('/:id/publish', authenticate, SurveyController.publish);

// Questions
router.post('/:id/questions', authenticate, SurveyController.addQuestion);
router.put('/questions/:questionId', authenticate, SurveyController.updateQuestion);
router.delete('/questions/:questionId', authenticate, SurveyController.deleteQuestion);
router.post('/:id/questions/reorder', authenticate, SurveyController.reorderQuestions);

export default router;
