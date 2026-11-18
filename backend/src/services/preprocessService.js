import { preprocessText } from '../../../nlp/preprocessing/preprocessText.js';

/**
 * Validates text input and runs the preprocessing pipeline.
 *
 * @param {string} text - Input tweet text.
 * @param {Object} [options] - Preprocessing options.
 * @returns {Object} Preprocessing stages.
 */
export function runPreprocessing(text, options = {}) {
  if (text === undefined || text === null) {
    const error = new Error("Field 'text' is required.");
    error.statusCode = 422;
    throw error;
  }

  if (typeof text !== 'string') {
    const error = new Error("Field 'text' must be a string.");
    error.statusCode = 422;
    throw error;
  }

  if (text.trim() === '') {
    const error = new Error("Field 'text' must not be empty.");
    error.statusCode = 422;
    throw error;
  }

  if (text.length > 2000) {
    const error = new Error("Field 'text' exceeds maximum length of 2000 characters.");
    error.statusCode = 422;
    throw error;
  }

  return preprocessText(text, options);
}

