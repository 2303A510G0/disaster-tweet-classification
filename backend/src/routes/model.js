/**
 * model.js — Express Router for Model Endpoints (T11)
 */

import express from 'express';
import {
  getModelStatus,
  trainModel,
  getModelComparison,
  predictText,
} from '../controllers/modelController.js';

const router = express.Router();

// Specific model routes under /api/model
router.get('/status', getModelStatus);
router.post('/train', trainModel);
router.get('/comparison', getModelComparison);
router.post('/predict', predictText);

export default router;

