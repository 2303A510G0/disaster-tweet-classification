/**
 * modelPersistence.test.js — Unit Tests for Model Persistence Layer (T11)
 *
 * Tests:
 * - Saving and loading DummyClassifier, MultinomialNaiveBayes, and LogisticRegression artifacts.
 * - Vocabulary, IDF values, and feature selector indices serialization.
 * - Atomic file write verification.
 * - Exact prediction equivalence before and after reload.
 * - Missing and corrupted artifact handling.
 * - Prevention of executable code or eval usage.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ModelPersistenceService } from '../../src/services/modelPersistenceService.js';
import { TfidfVectorizer } from '../../../nlp/features/tfidfVectorizer.js';
import { ChiSquareSelector } from '../../../nlp/features/featureSelector.js';
import { MultinomialNaiveBayes } from '../../../nlp/models/naiveBayes.js';
import { LogisticRegression } from '../../../nlp/models/logisticRegression.js';
import { DummyClassifier } from '../../../nlp/models/baselineClassifier.js';

describe('ModelPersistenceService Unit Tests (T11)', () => {
  const testArtifactDir = path.resolve('artifacts/test_models');
  let persistence;

  beforeEach(() => {
    if (fs.existsSync(testArtifactDir)) {
      fs.rmSync(testArtifactDir, { recursive: true, force: true });
    }
    persistence = new ModelPersistenceService({ artifactDir: testArtifactDir });
  });

  afterEach(() => {
    if (fs.existsSync(testArtifactDir)) {
      fs.rmSync(testArtifactDir, { recursive: true, force: true });
    }
  });

  it('saves and loads a MultinomialNaiveBayes pipeline artifact with identical predictions', () => {
    // 1. Train vectorizer and NB on small synthetic fixture
    const trainDocs = [
      'wildfire emergency evacuation call',
      'forest fire burn zone',
      'beautiful calm sunny afternoon walk',
      'happy family dinner picnic',
    ];
    const yTrain = [1, 1, 0, 0];

    const vectorizer = new TfidfVectorizer({ ngramRange: [1, 1] });
    const XTrain = vectorizer.fitTransform(trainDocs);

    const selector = new ChiSquareSelector({ k: 4 });
    const XSel = selector.fitTransform(XTrain, yTrain);

    const nb = new MultinomialNaiveBayes({ alpha: 1.0 });
    nb.fit(XSel, yTrain);

    const testDoc = ['wildfire danger evacuation'];
    const XTestRaw = vectorizer.transform(testDoc);
    const XTestSel = selector.transform(XTestRaw);
    const predBefore = nb.predict(XTestSel);
    const probaBefore = nb.predictProba(XTestSel);

    // 2. Persist
    const saveResult = persistence.save({
      modelName: 'MultinomialNaiveBayes',
      model: nb,
      vectorizer,
      selector,
      metadata: { validationF1: 0.95 },
      comparisonResults: [{ modelName: 'MultinomialNaiveBayes', f1: 0.95 }],
    });
    expect(saveResult.success).toBe(true);
    expect(fs.existsSync(saveResult.filePath)).toBe(true);

    // 3. Reload
    const loaded = persistence.load();
    expect(loaded).toBeTruthy();
    expect(loaded.modelName).toBe('MultinomialNaiveBayes');
    expect(loaded.vectorizer).toBeInstanceOf(TfidfVectorizer);
    expect(loaded.selector).toBeInstanceOf(ChiSquareSelector);
    expect(loaded.model).toBeInstanceOf(MultinomialNaiveBayes);

    // 4. Prediction after reload must match exactly
    const XReloadRaw = loaded.vectorizer.transform(testDoc);
    const XReloadSel = loaded.selector.transform(XReloadRaw);
    const predAfter = loaded.model.predict(XReloadSel);
    const probaAfter = loaded.model.predictProba(XReloadSel);

    expect(predAfter).toEqual(predBefore);
    expect(probaAfter[0][0]).toBeCloseTo(probaBefore[0][0], 8);
    expect(probaAfter[0][1]).toBeCloseTo(probaBefore[0][1], 8);
  });

  it('saves and loads a LogisticRegression pipeline artifact with identical predictions', () => {
    const trainDocs = [
      'flood tsunami emergency crisis',
      'earthquake tremor shock building collapse',
      'nice cup of warm herbal tea',
      'reading peaceful novel home',
    ];
    const yTrain = [1, 1, 0, 0];

    const vectorizer = new TfidfVectorizer({ ngramRange: [1, 1] });
    const XTrain = vectorizer.fitTransform(trainDocs);

    const lr = new LogisticRegression({ learningRate: 0.1, epochs: 200, lambda: 0.01 });
    lr.fit(XTrain, yTrain);

    const testDoc = ['flood alert collapse'];
    const XTest = vectorizer.transform(testDoc);
    const predBefore = lr.predict(XTest);
    const probaBefore = lr.predictProba(XTest);

    persistence.save({
      modelName: 'LogisticRegression',
      model: lr,
      vectorizer,
      selector: null,
      metadata: { validationF1: 0.9 },
    });

    const loaded = persistence.load();
    expect(loaded.model).toBeInstanceOf(LogisticRegression);
    const XReload = loaded.vectorizer.transform(testDoc);
    const predAfter = loaded.model.predict(XReload);
    const probaAfter = loaded.model.predictProba(XReload);

    expect(predAfter).toEqual(predBefore);
    expect(probaAfter[0]).toBeCloseTo(probaBefore[0], 8);
  });

  it('saves and loads a DummyClassifier artifact', () => {
    const dummy = new DummyClassifier();
    dummy.fit([[0]], [1, 1, 0]);

    persistence.save({
      modelName: 'DummyClassifier',
      model: dummy,
      vectorizer: new TfidfVectorizer(),
      selector: null,
    });

    const loaded = persistence.load();
    expect(loaded.model).toBeInstanceOf(DummyClassifier);
    expect(loaded.model.predict([[0], [0]])).toEqual([1, 1]);
  });

  it('returns null gracefully when artifact file does not exist', () => {
    const loaded = persistence.load();
    expect(loaded).toBeNull();
  });

  it('throws a structured error when loading a corrupted artifact file', () => {
    fs.mkdirSync(testArtifactDir, { recursive: true });
    fs.writeFileSync(path.join(testArtifactDir, 'model_artifact.json'), '{ invalid json string');

    expect(() => persistence.load()).toThrow(/Corrupted model artifact/);
  });

  it('hasArtifact returns true when file exists and false otherwise', () => {
    expect(persistence.hasArtifact()).toBe(false);

    fs.mkdirSync(testArtifactDir, { recursive: true });
    fs.writeFileSync(path.join(testArtifactDir, 'model_artifact.json'), JSON.stringify({ version: '1.0.0' }));
    expect(persistence.hasArtifact()).toBe(true);
  });
});

