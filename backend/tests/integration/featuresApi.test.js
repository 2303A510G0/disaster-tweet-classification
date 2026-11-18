/**
 * featuresApi.test.js — Integration Tests for Feature Extraction Endpoints (T15)
 *
 * Follows strict TDD (RED phase before implementation).
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Feature Extraction API Integration Tests (T15)', () => {
  describe('POST /api/features/extract', () => {
    it('returns 200 OK with BoW and TF-IDF extraction results for valid tweet text', async () => {
      const payload = {
        text: 'Forest fire alert evacuation near the city',
        ngramRange: [1, 1],
        sublinearTf: false,
      };

      const res = await request(app)
        .post('/api/features/extract')
        .send(payload)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('data');

      const { data } = res.body;
      expect(data).toHaveProperty('text', payload.text);
      expect(data).toHaveProperty('bow');
      expect(data).toHaveProperty('tfidf');

      // Bag of Words assertions
      expect(data.bow).toHaveProperty('vocabulary');
      expect(data.bow).toHaveProperty('featureNames');
      expect(data.bow).toHaveProperty('tokenCounts');
      expect(data.bow).toHaveProperty('denseVector');
      expect(Array.isArray(data.bow.vocabulary)).toBe(true);
      expect(Array.isArray(data.bow.featureNames)).toBe(true);
      expect(Array.isArray(data.bow.tokenCounts)).toBe(true);
      expect(Array.isArray(data.bow.denseVector)).toBe(true);

      // TF-IDF assertions
      expect(data.tfidf).toHaveProperty('terms');
      expect(data.tfidf).toHaveProperty('denseVector');
      expect(data.tfidf).toHaveProperty('norm', 'l2');
      expect(data.tfidf).toHaveProperty('smoothIdf', true);
      expect(Array.isArray(data.tfidf.terms)).toBe(true);
      expect(Array.isArray(data.tfidf.denseVector)).toBe(true);

      // Check term details structure
      if (data.tfidf.terms.length > 0) {
        const firstTerm = data.tfidf.terms[0];
        expect(firstTerm).toHaveProperty('term');
        expect(firstTerm).toHaveProperty('index');
        expect(firstTerm).toHaveProperty('tf');
        expect(firstTerm).toHaveProperty('df');
        expect(firstTerm).toHaveProperty('idf');
        expect(firstTerm).toHaveProperty('tfidf');
      }
    });

    it('supports custom corpus and unigram + bigram feature extraction', async () => {
      const payload = {
        text: 'emergency evacuation update',
        corpus: [
          'severe emergency evacuation ongoing',
          'weather update no damage reported',
        ],
        ngramRange: [1, 2],
      };

      const res = await request(app)
        .post('/api/features/extract')
        .send(payload);

      expect(res.status).toBe(200);
      const { data } = res.body;
      // Should include bigram terms
      const bigramTerm = data.bow.featureNames.find((name) => name.includes(' '));
      expect(bigramTerm).toBeDefined();
    });

    it('returns 422 when text is missing, empty, or whitespace-only', async () => {
      const resMissing = await request(app)
        .post('/api/features/extract')
        .send({});
      expect(resMissing.status).toBe(422);
      expect(resMissing.body).toHaveProperty('detail');

      const resEmpty = await request(app)
        .post('/api/features/extract')
        .send({ text: '   ' });
      expect(resEmpty.status).toBe(422);
      expect(resEmpty.body).toHaveProperty('detail');
    });

    it('returns 422 when text is not a string', async () => {
      const res = await request(app)
        .post('/api/features/extract')
        .send({ text: 9999 });
      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('detail');
    });

    it('returns 422 when text exceeds 2000 characters', async () => {
      const res = await request(app)
        .post('/api/features/extract')
        .send({ text: 'a'.repeat(2001) });
      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('detail');
    });
  });

  describe('GET /api/features/dataset-info', () => {
    it('returns status indicating whether dataset-wide trained features are loaded', async () => {
      const res = await request(app).get('/api/features/dataset-info');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('isTrained');
      expect(res.body.data).toHaveProperty('datasetAvailable');
    });
  });

  describe('GET /api/features/educational-demo', () => {
    it('returns educational BoW, TF-IDF, and Chi-Square contingency data', async () => {
      const res = await request(app).get('/api/features/educational-demo');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('data');

      const { data } = res.body;
      expect(data).toHaveProperty('isEducational', true);
      expect(data).toHaveProperty('documents');
      expect(data).toHaveProperty('bowDemo');
      expect(data).toHaveProperty('tfidfDemo');
      expect(data).toHaveProperty('chi2Demo');

      // Chi-square demo contains 2x2 contingency table metrics
      expect(data.chi2Demo).toHaveProperty('features');
      expect(Array.isArray(data.chi2Demo.features)).toBe(true);
      if (data.chi2Demo.features.length > 0) {
        const feat = data.chi2Demo.features[0];
        expect(feat).toHaveProperty('term');
        expect(feat).toHaveProperty('contingency');
        expect(feat.contingency).toHaveProperty('A');
        expect(feat.contingency).toHaveProperty('B');
        expect(feat.contingency).toHaveProperty('C');
        expect(feat.contingency).toHaveProperty('D');
        expect(feat).toHaveProperty('chi2Score');
      }
    });
  });
});
