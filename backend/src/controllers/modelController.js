/**
 * modelController.js — Controller for Model Training, Comparison, Status, and Prediction (T11/T12)
 */

import { modelService } from '../services/modelService.js';

/**
 * GET /api/model/status
 */
export async function getModelStatus(req, res, next) {
  try {
    const status = modelService.getStatus();
    return res.status(200).json({
      status: 'success',
      data: status,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/model/train
 */
export async function trainModel(req, res, next) {
  try {
    const { records, filePath } = req.body || {};

    // Validate records if provided
    if (records !== undefined && !Array.isArray(records)) {
      return res.status(422).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Field records must be an array.',
        detail: 'Field records must be an array.',
      });
    }

    // Validate filePath if provided
    if (filePath !== undefined) {
      if (typeof filePath !== 'string' || filePath.includes('..') || !filePath.endsWith('.csv')) {
        return res.status(422).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Invalid file path. Path traversal or invalid extensions are not permitted.',
          detail: 'Invalid file path. Path traversal or invalid extensions are not permitted.',
        });
      }
    }

    const result = await modelService.train({ records, filePath });

    if (result.datasetMissing) {
      return res.status(503).json({
        status: 'unavailable',
        code: 'DATASET_MISSING',
        message: result.message || 'Dataset file not found. Please provide the real Kaggle Disaster Tweets CSV.',
        detail: result.message || 'Dataset file not found. Please provide the real Kaggle Disaster Tweets CSV.',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Model training and validation comparison completed successfully.',
      data: {
        splits: result.splits,
        bestModel: result.bestModel,
        comparison: result.comparisonResults,
      },
    });
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({
        status: 'error',
        code: 'TRAINING_IN_PROGRESS',
        message: err.message,
        detail: err.message,
      });
    }
    next(err);
  }
}

/**
 * GET /api/model/comparison
 */
export async function getModelComparison(req, res, next) {
  try {
    const comparison = modelService.getComparison();
    return res.status(200).json({
      status: comparison.status,
      message: comparison.message,
      data: {
        models: comparison.models || [],
        selectedModel: comparison.selectedModel,
        bestMetadata: comparison.bestMetadata,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/model/predict (and alias /api/predict)
 */
export async function predictText(req, res, next) {
  try {
    const { text } = req.body || {};

    if (text === undefined || text === null || typeof text !== 'string') {
      return res.status(422).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Input text must be a string.',
        detail: 'Input text must be a string.',
      });
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return res.status(422).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Input text cannot be empty.',
        detail: 'Input text cannot be empty.',
      });
    }

    if (trimmed.length > 5000) {
      return res.status(422).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Input text exceeds maximum allowed length of 5000 characters.',
        detail: 'Input text exceeds maximum allowed length of 5000 characters.',
      });
    }

    const predictionResult = await modelService.predict(trimmed);

    return res.status(200).json({
      status: 'success',
      data: predictionResult,
    });
  } catch (err) {
    if (err.statusCode === 503 || err.code === 'NO_MODEL_LOADED') {
      return res.status(503).json({
        status: 'error',
        code: 'NO_MODEL_LOADED',
        message: err.message,
        detail: err.message,
      });
    }
    next(err);
  }
}
