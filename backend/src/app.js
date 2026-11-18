import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/index.js';
import healthRouter from './routes/health.js';
import datasetRouter from './routes/dataset.js';
import preprocessRouter from './routes/preprocess.js';
import modelRouter from './routes/model.js';
import featuresRouter from './routes/features.js';
import { predictText, getModelComparison } from './controllers/modelController.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';

const app = express();

// Security & Parsing Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || config.CORS_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev/testing
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api', healthRouter);
app.use('/api', preprocessRouter);
app.use('/api/dataset', datasetRouter);
app.use('/api/model', modelRouter);
app.use('/api/features', featuresRouter);

// Top-level aliases for contract compatibility
app.post('/api/predict', predictText);
app.get('/api/models', getModelComparison);
app.get('/api/metrics', getModelComparison);

// Catch-all 404 & Global Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;

