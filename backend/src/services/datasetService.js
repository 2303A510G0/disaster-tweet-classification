import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadAndAnalyzeDataset } from '../../../nlp/ingestion/datasetLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getDefaultDatasetPath() {
  return resolve(__dirname, '../../../data/raw/train.csv');
}

/**
 * Retrieves the exploratory data analysis summary of the Disaster Tweets dataset.
 *
 * @param {string} [customPath] - Optional override path for dataset file.
 * @returns {Promise<Object>} Dataset summary object.
 */
export async function getDatasetSummary(customPath) {
  const targetPath = customPath || getDefaultDatasetPath();

  if (!fs.existsSync(targetPath)) {
    const error = new Error('Dataset not found. Place the original Kaggle train.csv file in data/raw/train.csv.');
    error.code = 'DATASET_MISSING';
    error.statusCode = 503;
    throw error;
  }

  return await loadAndAnalyzeDataset(targetPath);
}
