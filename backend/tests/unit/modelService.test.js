/**
 * modelService.test.js — Unit Tests for Model Service (T11)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ModelService } from '../../src/services/modelService.js';
import { ModelPersistenceService } from '../../src/services/modelPersistenceService.js';

describe('ModelService Unit Tests (T11)', () => {
  const testArtifactDir = path.resolve('artifacts/test_service_models');
  let persistence;
  let modelService;

  function makeRecords(n = 20) {
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
    if (fs.existsSync(testArtifactDir)) {
      fs.rmSync(testArtifactDir, { recursive: true, force: true });
    }
    persistence = new ModelPersistenceService({ artifactDir: testArtifactDir });
    modelService = new ModelService({ persistenceService: persistence });
  });

  afterEach(() => {
    if (fs.existsSync(testArtifactDir)) {
      fs.rmSync(testArtifactDir, { recursive: true, force: true });
    }
  });

  it('reports initial status as idle with no model loaded', () => {
    const status = modelService.getStatus();
    expect(status.trainingStatus).toBe('idle');
    expect(status.isTraining).toBe(false);
    expect(status.modelLoaded).toBe(false);
    expect(status.selectedModel).toBeNull();
  });

  it('returns datasetMissing when train() runs without dataset and without records', async () => {
    // Provide a non-existent filePath
    const result = await modelService.train({ filePath: 'data/raw/non_existent.csv' });
    expect(result.datasetMissing).toBe(true);
    expect(modelService.getStatus().trainingStatus).toBe('idle');
    expect(modelService.getStatus().modelLoaded).toBe(false);
  });

  it('trains successfully when provided in-memory records', async () => {
    const records = makeRecords(24);
    const result = await modelService.train({ records });

    expect(result.datasetMissing).toBe(false);
    expect(result.bestModel).toBeTruthy();

    const status = modelService.getStatus();
    expect(status.trainingStatus).toBe('trained');
    expect(status.modelLoaded).toBe(true);
    expect(status.selectedModel).toBeTruthy();
    expect(status.artifactAvailable).toBe(true);
  });

  it('prevents concurrent training runs', async () => {
    modelService.isTraining = true;
    await expect(modelService.train({ records: makeRecords(10) })).rejects.toThrow(
      /Training is already in progress/
    );
  });

  it('throws an error when predicting before any model is trained or loaded', async () => {
    await expect(modelService.predict('Severe earthquake reported')).rejects.toThrow(
      /No trained model is currently loaded/
    );
  });

  it('predicts with structured output after model training', async () => {
    await modelService.train({ records: makeRecords(24) });

    const result = await modelService.predict('Massive earthquake emergency evacuation');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('prediction');
    expect([0, 1]).toContain(result.prediction);
    expect(result).toHaveProperty('label');
    expect(['Disaster', 'Not Disaster']).toContain(result.label);
    expect(result).toHaveProperty('probabilities');
    expect(result.probabilities).toHaveProperty('not_disaster');
    expect(result.probabilities).toHaveProperty('disaster');
    expect(result).toHaveProperty('model_name');
  });

  it('validates text input for prediction', async () => {
    await modelService.train({ records: makeRecords(24) });

    await expect(modelService.predict('')).rejects.toThrow(/Input text cannot be empty/);
    await expect(modelService.predict(null)).rejects.toThrow(/Input text must be a string/);
    await expect(modelService.predict('   ')).rejects.toThrow(/Input text cannot be empty/);

    const oversized = 'a'.repeat(5001);
    await expect(modelService.predict(oversized)).rejects.toThrow(/exceeds maximum allowed length/);
  });

  it('returns comparison results after training', async () => {
    await modelService.train({ records: makeRecords(24) });
    const comparison = modelService.getComparison();

    expect(comparison).toBeTruthy();
    expect(Array.isArray(comparison.models)).toBe(true);
    expect(comparison.models.length).toBeGreaterThanOrEqual(3);
    expect(comparison.selectedModel).toBeTruthy();
  });

  it('restores model state from persistence artifact on loadFromDisk()', async () => {
    await modelService.train({ records: makeRecords(24) });
    const initialPrediction = await modelService.predict('Flood crisis alert');

    // Create fresh service instance with autoLoad: false
    const newService = new ModelService({ persistenceService: persistence, autoLoad: false });
    expect(newService.getStatus().modelLoaded).toBe(false);

    const loaded = newService.loadFromDisk();
    expect(loaded).toBe(true);
    expect(newService.getStatus().modelLoaded).toBe(true);

    const reloadedPrediction = await newService.predict('Flood crisis alert');
    expect(reloadedPrediction.prediction).toBe(initialPrediction.prediction);
    expect(reloadedPrediction.probabilities.disaster).toBeCloseTo(
      initialPrediction.probabilities.disaster,
      6
    );
  });
});
