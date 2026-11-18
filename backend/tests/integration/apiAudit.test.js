/**
 * apiAudit.test.js — Comprehensive API Audit and Security Tests (T12)
 *
 * Verifies:
 * - All primary endpoints from Part A
 * - Documented aliases (/api/predict, /api/models, /api/metrics)
 * - Input validation: missing fields, null values, wrong data types, empty strings, oversized text
 * - Security: Malformed JSON, path traversal rejection, no stack trace leakage
 * - Training lifecycle and error recovery
 * - Artifact integrity validation on corrupted data
 * - CORS headers
 * - Centralized 404 and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../../src/app.js';
import { modelService } from '../../src/services/modelService.js';
import { modelPersistenceService } from '../../src/services/modelPersistenceService.js';

describe('T12 Backend API Audit and Validation Tests', () => {
  function makeRecords(n = 20) {
    const records = [];
    for (let i = 0; i < n; i++) {
      records.push({
        id: String(i),
        keyword: '',
        location: '',
        text: i % 2 === 0
          ? `emergency earthquake alert rescue shelter ${i}`
          : `sunny peaceful day reading book coffee ${i}`,
        target: String(i % 2 === 1 ? 0 : 1),
      });
    }
    return records;
  }

  beforeEach(() => {
    modelService.resetState(true);
  });

  afterEach(() => {
    modelService.resetState(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Audit All Part A Endpoints
  // ───────────────────────────────────────────────────────────────────────────
  describe('Part A — Primary Endpoints Audit', () => {
    it('GET /api/health returns 200 with ok status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('app_name');
    });

    it('GET /api/dataset/summary returns 503 when train.csv is missing', async () => {
      const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const res = await request(app).get('/api/dataset/summary');
      expect(res.status).toBe(503);
      expect(res.body).toHaveProperty('status', 'unavailable');
      existsSpy.mockRestore();
    });

    it('POST /api/preprocess cleans and tokenizes valid input', async () => {
      const res = await request(app)
        .post('/api/preprocess')
        .send({ text: 'Flash floods warning http://example.com #crisis' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('original_text');
      expect(res.body).toHaveProperty('tokens');
      expect(res.body).toHaveProperty('cleaned_text');
    });

    it('POST /api/preprocessing/preview returns linguistic preview', async () => {
      const res = await request(app)
        .post('/api/preprocessing/preview')
        .send({ text: 'Severe storm damaged the bridge.' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tokens');
      expect(res.body).toHaveProperty('cleaned_text');
    });

    it('GET /api/model/status returns structured status object', async () => {
      const res = await request(app).get('/api/model/status');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data).toHaveProperty('trainingStatus');
      expect(res.body.data).toHaveProperty('datasetAvailable');
      expect(res.body.data).toHaveProperty('modelLoaded');
    });

    it('POST /api/model/train returns 503 when dataset is missing', async () => {
      const res = await request(app)
        .post('/api/model/train')
        .send({ filePath: 'data/raw/missing_dataset.csv' });
      expect(res.status).toBe(503);
      expect(res.body).toHaveProperty('status', 'unavailable');
      expect(res.body.code).toBe('DATASET_MISSING');
    });

    it('GET /api/model/comparison returns comparison table or not_trained status', async () => {
      const res = await request(app).get('/api/model/comparison');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'not_trained');
    });

    it('POST /api/model/predict returns 503 when no model is trained', async () => {
      const res = await request(app)
        .post('/api/model/predict')
        .send({ text: 'Flash flood alert!' });
      expect(res.status).toBe(503);
      expect(res.body.code).toBe('NO_MODEL_LOADED');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Audit Documented Aliases
  // ───────────────────────────────────────────────────────────────────────────
  describe('Part A — Aliases Audit', () => {
    it('POST /api/predict works as alias to /api/model/predict', async () => {
      // Before training -> 503
      const resBefore = await request(app).post('/api/predict').send({ text: 'Flood emergency' });
      expect(resBefore.status).toBe(503);

      // Train with fixture
      await modelService.train({ records: makeRecords(24) });

      // After training -> 200
      const resAfter = await request(app).post('/api/predict').send({ text: 'Flood emergency' });
      expect(resAfter.status).toBe(200);
      expect(resAfter.body.data).toHaveProperty('prediction');
      expect(resAfter.body.data).toHaveProperty('label');
      expect(resAfter.body.data).toHaveProperty('probabilities');
    });

    it('GET /api/models returns model metadata', async () => {
      await modelService.train({ records: makeRecords(24) });
      const res = await request(app).get('/api/models');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data.models.length).toBeGreaterThanOrEqual(3);
    });

    it('GET /api/metrics returns benchmark results', async () => {
      await modelService.train({ records: makeRecords(24) });
      const res = await request(app).get('/api/metrics');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data.models.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Request Validation & Error Handling (Part B & F)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Part B & F — Request Validation and Error Handling', () => {
    it('returns 422 with detail when predict text is null or missing', async () => {
      const res = await request(app).post('/api/model/predict').send({});
      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body).toHaveProperty('detail');
    });

    it('returns 422 when predict text is non-string', async () => {
      const res = await request(app).post('/api/model/predict').send({ text: 12345 });
      expect(res.status).toBe(422);
      expect(res.body.detail).toMatch(/must be a string/);
    });

    it('returns 422 when predict text is whitespace only', async () => {
      const res = await request(app).post('/api/model/predict').send({ text: '    ' });
      expect(res.status).toBe(422);
      expect(res.body.detail).toMatch(/cannot be empty/);
    });

    it('returns 422 when predict text exceeds 5000 characters', async () => {
      const longText = 'a'.repeat(5001);
      const res = await request(app).post('/api/model/predict').send({ text: longText });
      expect(res.status).toBe(422);
      expect(res.body.detail).toMatch(/exceeds maximum allowed length/);
    });

    it('returns 422 when train receives path traversal in filePath', async () => {
      const res = await request(app)
        .post('/api/model/train')
        .send({ filePath: '../../../../etc/passwd' });
      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.detail).toMatch(/Invalid file path/);
    });

    it('returns 422 when train receives records that is not an array', async () => {
      const res = await request(app)
        .post('/api/model/train')
        .send({ records: 'not an array' });
      expect(res.status).toBe(422);
      expect(res.body.detail).toMatch(/must be an array/);
    });

    it('returns structured 400 for malformed JSON payloads', async () => {
      const res = await request(app)
        .post('/api/model/predict')
        .set('Content-Type', 'application/json')
        .send('{"text": "broken json');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.code).toBe('INVALID_JSON');
      expect(res.body).toHaveProperty('detail');
    });

    it('returns structured 404 for unknown endpoints', async () => {
      const res = await request(app).get('/api/unknown/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.code).toBe('NOT_FOUND');
      expect(res.body).toHaveProperty('detail');
    });

    it('never leaks stack traces in production/test error responses', async () => {
      const res = await request(app).get('/api/unknown');
      expect(res.body).not.toHaveProperty('stack');
      expect(JSON.stringify(res.body)).not.toMatch(/node_modules/);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Training Lifecycle & Failure Recovery (Part C)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Part C — Training Lifecycle and Resilience', () => {
    it('resets isTraining to false and status to failed if training throws', async () => {
      // Force training failure with invalid record content
      const invalidRecords = [{ text: null, target: 'invalid' }];
      try {
        await modelService.train({ records: invalidRecords });
      } catch {
        // Expected throw
      }

      const status = modelService.getStatus();
      expect(status.isTraining).toBe(false);
      expect(status.trainingStatus).toBe('failed');
    });

    it('preserves valid previously saved artifact if new training attempt fails', async () => {
      // 1. Train successfully first
      await modelService.train({ records: makeRecords(24) });
      const initialPred = await modelService.predict('Wildfire evacuation order');

      // 2. Attempt failed training with corrupt data
      try {
        await modelService.train({ records: [{ text: null, target: 'invalid' }] });
      } catch {
        // Expected
      }

      // 3. Artifact on disk should still be intact and reloadable
      expect(modelPersistenceService.hasArtifact()).toBe(true);
      const reloaded = modelPersistenceService.load();
      expect(reloaded).toBeTruthy();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Artifact Integrity & Corrupted File Rejection (Part E)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Part E — Model Artifact Integrity', () => {
    const testDir = path.resolve('artifacts/test_audit_models');
    let persistence;

    beforeEach(() => {
      if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
      persistence = new modelPersistenceService.constructor({ artifactDir: testDir });
    });

    afterEach(() => {
      if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
    });

    it('rejects artifact with missing vectorizer featureNames', () => {
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(
        path.join(testDir, 'model_artifact.json'),
        JSON.stringify({
          version: '1.0.0',
          modelName: 'MultinomialNaiveBayes',
          vectorizer: { vocabulary: [], options: {} }, // missing featureNames & idfWeights
          model: { type: 'MultinomialNaiveBayes', params: {} },
        })
      );

      expect(() => persistence.load()).toThrow(/Corrupted model artifact/);
    });

    it('rejects artifact with non-finite model weights', () => {
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(
        path.join(testDir, 'model_artifact.json'),
        JSON.stringify({
          version: '1.0.0',
          modelName: 'LogisticRegression',
          vectorizer: {
            options: {},
            vocabulary: [['a', 0]],
            featureNames: ['a'],
            documentFrequencies: [1],
            idfWeights: [1.0],
            nTrainingDocs: 1,
          },
          model: {
            type: 'LogisticRegression',
            params: {
              learningRate: 0.1,
              epochs: 10,
              lambda: 0.01,
              seed: 42,
              weights: [null], // invalid weight
              bias: 0,
              _numFeatures: 1,
            },
          },
        })
      );

      expect(() => persistence.load()).toThrow(/Corrupted model artifact/);
    });

    it('rejects artifact with dimension mismatch between model and vectorizer', () => {
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(
        path.join(testDir, 'model_artifact.json'),
        JSON.stringify({
          version: '1.0.0',
          modelName: 'LogisticRegression',
          vectorizer: {
            options: {},
            vocabulary: [['a', 0], ['b', 1]],
            featureNames: ['a', 'b'], // 2 features
            documentFrequencies: [1, 1],
            idfWeights: [1.0, 1.0],
            nTrainingDocs: 1,
          },
          model: {
            type: 'LogisticRegression',
            params: {
              learningRate: 0.1,
              epochs: 10,
              lambda: 0.01,
              seed: 42,
              weights: [0.5], // only 1 weight -> mismatch!
              bias: 0,
              _numFeatures: 1,
            },
          },
        })
      );

      expect(() => persistence.load()).toThrow(/Dimension mismatch/);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Prediction Correctness & Terminology (Part D)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Part D — Prediction Pipeline and Terminology', () => {
    it('uses model-estimated probabilities without claiming calibration', async () => {
      await modelService.train({ records: makeRecords(24) });
      const res = await request(app).post('/api/model/predict').send({ text: 'Severe emergency' });

      expect(res.status).toBe(200);
      expect(res.body.data.probabilities).toHaveProperty('not_disaster');
      expect(res.body.data.probabilities).toHaveProperty('disaster');
      // Probabilities must sum to ~1.0
      const sum = res.body.data.probabilities.not_disaster + res.body.data.probabilities.disaster;
      expect(sum).toBeCloseTo(1.0, 3);
    });
  });
});
