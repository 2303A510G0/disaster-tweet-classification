import { Router } from 'express';
import { getSummaryHandler } from '../controllers/datasetController.js';

const router = Router();

router.get('/summary', getSummaryHandler);

export default router;

