import { Router } from 'express';
import { mlModelController } from '../controllers/mlModelController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All ML model routes require authentication
router.use(authenticate);

// Get all models
router.get('/models', mlModelController.getAll);

// Get specific model
router.get('/models/:id', mlModelController.getOne);

// Create new model (train)
router.post('/models', mlModelController.create);

// Update model
router.put('/models/:id', mlModelController.update);

// Delete model
router.delete('/models/:id', mlModelController.delete);

// Archive model
router.post('/models/:id/archive', mlModelController.archive);

// Make prediction
router.post('/models/:id/predict', mlModelController.predict);

// Batch predictions
router.post('/models/:id/predict/batch', mlModelController.batchPredict);

// Get predictions for a model
router.get('/models/:id/predictions', mlModelController.getPredictions);

// Get model statistics
router.get('/models/:id/stats', mlModelController.getStats);

export default router;
