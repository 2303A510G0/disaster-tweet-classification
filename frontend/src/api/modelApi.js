/**
 * modelApi.js — Model Status, Training, Comparison, and Prediction Client
 */

import { get, post } from './apiClient.js';

export async function getModelStatus() {
  return get('/model/status');
}

export async function trainModel(options = {}) {
  return post('/model/train', options);
}

export async function getModelComparison() {
  return get('/model/comparison');
}

export async function predictTweet(text) {
  return post('/model/predict', { text });
}

