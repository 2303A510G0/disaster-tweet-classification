/**
 * featuresApi.js — API Client for Feature Extraction and Selection Endpoints (T15)
 */

import { get, post } from './apiClient.js';

/**
 * Extracts Bag of Words (BoW) and TF-IDF features for input text.
 *
 * @param {Object} payload
 * @param {string} payload.text - Raw tweet text.
 * @param {string[]} [payload.corpus] - Custom reference corpus.
 * @param {number[]} [payload.ngramRange] - [minN, maxN] n-gram range.
 * @param {boolean} [payload.sublinearTf] - Sublinear TF flag.
 * @returns {Promise<Object>} Feature extraction result.
 */
export async function extractFeatures(payload) {
  const res = await post('/features/extract', payload);
  return res.data;
}

/**
 * Fetches dataset-wide trained feature status and sample features.
 *
 * @returns {Promise<Object>}
 */
export async function getDatasetFeaturesInfo() {
  const res = await get('/features/dataset-info');
  return res.data;
}

/**
 * Fetches the pre-calculated educational demonstration for BoW, TF-IDF,
 * and 2x2 Chi-Square contingency tables.
 *
 * @returns {Promise<Object>}
 */
export async function getEducationalDemo() {
  const res = await get('/features/educational-demo');
  return res.data;
}
