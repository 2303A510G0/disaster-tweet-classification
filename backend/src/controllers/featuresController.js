/**
 * featuresController.js — Controller for Feature Extraction & Selection Endpoints (T15)
 */

import {
  extractFeatures,
  getDatasetFeaturesInfo,
  getEducationalDemo,
} from '../services/featuresService.js';

export function extractFeaturesHandler(req, res, next) {
  try {
    const result = extractFeatures(req.body || {});
    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    if (err.statusCode === 422) {
      return res.status(422).json({
        detail: err.message,
      });
    }
    next(err);
  }
}

export function getDatasetFeaturesHandler(req, res, next) {
  try {
    const result = getDatasetFeaturesInfo();
    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export function getEducationalDemoHandler(req, res, next) {
  try {
    const result = getEducationalDemo();
    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
