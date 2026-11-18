import { Router } from 'express';
import { config } from '../config/index.js';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app_name: config.APP_NAME,
    version: config.VERSION,
  });
});

export default router;

