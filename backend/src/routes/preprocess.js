import { Router } from 'express';
import { preprocessHandler } from '../controllers/preprocessController.js';

const router = Router();

// Primary endpoint
router.post('/preprocess', preprocessHandler);

// Backward-compatible alias
router.post('/preprocessing/preview', preprocessHandler);

export default router;
