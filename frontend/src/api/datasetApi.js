/**
 * datasetApi.js — Dataset Summary Endpoint Client
 */

import { get } from './apiClient.js';

export async function getDatasetSummary() {
  return get('/dataset/summary');
}

