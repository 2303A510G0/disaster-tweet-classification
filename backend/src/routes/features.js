/**
 * features.js — Express Router for Feature Extraction & Selection (T15)
 */

import { Router } from 'express';
import {
  extractFeaturesHandler,
  getDatasetFeaturesHandler,
  getEducationalDemoHandler,
} from '../controllers/featuresController.js';

const router = Router();

// POST /api/features/extract — Real-time BoW and TF-IDF extraction
router.post('/extract', extractFeaturesHandler);

// GET /api/features/dataset-info — Status of dataset-trained vocabulary and Chi2 features
router.get('/dataset-info', getDatasetFeaturesHandler);

// GET /api/features/educational-demo — Educational demo of BoW, TF-IDF, and 2x2 Chi-Square tables
router.get('/educational-demo', getEducationalDemoHandler);

export default router;
