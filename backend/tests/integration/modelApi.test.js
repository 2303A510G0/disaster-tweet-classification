/**
 * modelApi.test.js — Integration Tests for Model REST API (T11)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../../src/app.js';
import { modelService } from '../../src/services/modelService.js';

describe('Model REST API Integration Tests (T11)', () => {
  const testArtifactDir = path.resolve('artifacts/models');

  function makeRecords(n = 24) {
    const records = [];
    for (let i = 0; i < n; i++) {
      records.push({
        id: String(i),
        keyword: '',
        location: '',
        text: i % 2 === 0
          ? `flood disaster emergency rescue zone shelter ${i}`
          : `sunny peaceful day reading garden coffee ${i}`,
        target: String(i % 2 === 1 ? 0 : 1),
      });
    }
    return records;
  }

  beforeEach(() => {
    // Reset service state and clear disk artifact before each test
    modelService.resetState(true);
  });

  afterEach(() => {
    modelService.resetState(true);
  });

  describe('GET /api/model/status', () => {
    it('returns service status and dataset availability', async () => {
      const res = await request(app).get('/api/model/status');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('datasetAvailable');
      expect(res.body.data).toHaveProperty('trainingStatus');
      expect(res.body.data).toHaveProperty('modelLoaded');
      expect(res.body.data).toHaveProperty('isTraining');
    });
  });

  describe('GET /api/model/comparison', () => {
    it('returns status not_trained when no training has taken place', async () => {
      const res = await request(app).get('/api/model/comparison');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'not_trained');
      expect(res.body.data.models).toHaveLength(0);
    });
  });

  describe('POST /api/model/predict', () => {
    it('returns 503 when no model is trained or loaded', async () => {
      const res = await request(app)
        .post('/api/model/predict')
        .send({ text: 'Severe flood in city' });

      expect(res.status).toBe(503);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/No trained model/);
    });

    it('returns 422 or 400 when text is empty or missing', async () => {
      const res1 = await request(app).post('/api/model/predict').send({});
      expect([400, 422]).toContain(res1.status);

      const res2 = await request(app).post('/api/model/predict').send({ text: '   ' });
      expect([400, 422]).toContain(res2.status);
    });
  });

  describe('POST /api/model/train', () => {
    it('returns 503 when Kaggle dataset file is absent', async () => {
      const res = await request(app)
        .post('/api/model/train')
        .send({ filePath: 'data/raw/missing_train.csv' });
      expect(res.status).toBe(503);
      expect(res.body).toHaveProperty('status', 'unavailable');
      expect(res.body.message).toMatch(/Dataset file not found/);
    });

    it('trains successfully and enables prediction when records are provided', async () => {
      const records = makeRecords(24);
      const trainRes = await request(app)
        .post('/api/model/train')
        .send({ records });

      expect(trainRes.status).toBe(200);
      expect(trainRes.body).toHaveProperty('status', 'success');
      expect(trainRes.body.data).toHaveProperty('bestModel');

      // Now prediction should succeed
      const predRes = await request(app)
        .post('/api/model/predict')
        .send({ text: 'Emergency flood warning shelter needed' });

      expect(predRes.status).toBe(200);
      expect(predRes.body).toHaveProperty('status', 'success');
      expect(predRes.body.data).toHaveProperty('prediction');
      expect(predRes.body.data).toHaveProperty('label');
      expect(predRes.body.data).toHaveProperty('probabilities');

      // Model comparison should also be available
      const compRes = await request(app).get('/api/model/comparison');
      expect(compRes.status).toBe(200);
      expect(compRes.body).toHaveProperty('status', 'success');
      expect(compRes.body.data.models.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Existing endpoints remain functional', () => {
    it('GET /api/health still returns 200 OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('POST /api/preprocess still returns 200 OK', async () => {
      const res = await request(app)
        .post('/api/preprocess')
        .send({ text: 'Emergency alert http://example.com' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tokens');
    });
  });
});
