import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import app from '../../src/app.js';
import * as datasetService from '../../src/services/datasetService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('datasetService default path resolution', () => {
  it('resolves the default dataset path to project-root data/raw/train.csv without __dirname errors', () => {
    const defaultPath = datasetService.getDefaultDatasetPath();
    const expectedPath = resolve(__dirname, '../../../data/raw/train.csv');

    expect(defaultPath).toBe(expectedPath);
    expect(defaultPath).toMatch(/[\\/]data[\\/]raw[\\/]train\.csv$/);
  });

  it('throws DATASET_MISSING 503 error when dataset file does not exist', async () => {
    const nonExistentPath = resolve(__dirname, 'non_existent_file.csv');
    await expect(datasetService.getDatasetSummary(nonExistentPath)).rejects.toThrow(/Dataset not found/i);
    try {
      await datasetService.getDatasetSummary(nonExistentPath);
    } catch (err) {
      expect(err.code).toBe('DATASET_MISSING');
      expect(err.statusCode).toBe(503);
    }
  });

  it('loads real dataset summary when data/raw/train.csv exists', async () => {
    if (fs.existsSync(datasetService.getDefaultDatasetPath())) {
      const summary = await datasetService.getDatasetSummary();
      expect(summary.status).toBe('available');
      expect(summary.filename).toBe('train.csv');
      expect(summary.total_records).toBe(7613);
      expect(summary.columns).toEqual(['id', 'keyword', 'location', 'text', 'target']);
    }
  });
});

describe('GET /api/dataset/summary', () => {
  it('returns 503 Service Unavailable when data/raw/train.csv is missing', async () => {
    // Isolate test from physical dataset presence to test 503 path
    const spy = vi.spyOn(datasetService, 'getDatasetSummary').mockImplementation(() => {
      const err = new Error('Dataset not found. Place the original Kaggle train.csv file in data/raw/train.csv.');
      err.code = 'DATASET_MISSING';
      err.statusCode = 503;
      throw err;
    });

    const res = await request(app).get('/api/dataset/summary');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      status: 'unavailable',
      detail: 'Dataset not found. Place the original Kaggle train.csv file in data/raw/train.csv.',
    });

    spy.mockRestore();
  });

  it('returns 200 OK with complete dataset summary when dataset is available', async () => {
    const res = await request(app).get('/api/dataset/summary');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('available');
    expect(res.body.filename).toBe('train.csv');
    expect(res.body.total_records).toBe(7613);
    expect(res.body.columns).toEqual(['id', 'keyword', 'location', 'text', 'target']);
    expect(res.body.class_distribution).toHaveProperty('disaster');
    expect(res.body.class_distribution).toHaveProperty('non_disaster');
  });
});
