/**
 * preprocessApi.js — Text Preprocessing Endpoint Client
 */

import { post } from './apiClient.js';

export async function preprocessText(text, options = {}) {
  return post('/preprocess', { text, options });
}

export async function previewPreprocessing(text, options = {}) {
  return post('/preprocessing/preview', { text, ...options });
}

