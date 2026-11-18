/**
 * modelService.js — Backend Model Training, Inference, and Management Service (T11)
 *
 * Integrates the NLP ExperimentPipeline, ModelPersistenceService, and active model inference.
 */

import fs from 'fs';
import path from 'path';
import { ExperimentPipeline } from '../../../nlp/pipeline/experimentPipeline.js';
import { modelPersistenceService } from './modelPersistenceService.js';
import { getDefaultDatasetPath } from './datasetService.js';

export class ModelService {
  constructor(options = {}) {
    this.persistenceService = options.persistenceService || modelPersistenceService;
    this.datasetPath = options.datasetPath ? path.resolve(options.datasetPath) : getDefaultDatasetPath();

    this.isTraining = false;
    this.trainingStatus = 'idle'; // 'idle' | 'training' | 'trained' | 'failed'
    this.selectedModelName = null;
    this.comparisonResults = null;
    this.bestModelMetadata = null;

    // Active loaded components for inference
    this.activeModel = null;
    this.activeVectorizer = null;
    this.activeSelector = null;

    if (options.autoLoad !== false) {
      this.loadFromDisk();
    }
  }

  /**
   * Resets in-memory state (useful for test isolation).
   *
   * @param {boolean} [clearDisk=false] - Whether to also delete persisted artifact on disk.
   */
  resetState(clearDisk = false) {
    this.isTraining = false;
    this.trainingStatus = 'idle';
    this.selectedModelName = null;
    this.comparisonResults = null;
    this.bestModelMetadata = null;
    this.activeModel = null;
    this.activeVectorizer = null;
    this.activeSelector = null;

    if (clearDisk && this.persistenceService) {
      try {
        if (fs.existsSync(this.persistenceService.artifactPath)) {
          fs.unlinkSync(this.persistenceService.artifactPath);
        }
      } catch {
        // Ignore file removal errors during reset
      }
    }
  }

  /**
   * Attempts to load pre-existing trained artifacts from disk.
   *
   * @returns {boolean} True if successfully loaded, false otherwise.
   */
  loadFromDisk() {
    if (!this.persistenceService.hasArtifact()) {
      return false;
    }

    try {
      const loaded = this.persistenceService.load();
      if (loaded) {
        this.activeModel = loaded.model;
        this.activeVectorizer = loaded.vectorizer;
        this.activeSelector = loaded.selector;
        this.selectedModelName = loaded.modelName;
        this.comparisonResults = loaded.comparisonResults;
        this.bestModelMetadata = loaded.metadata;
        this.trainingStatus = 'trained';
        return true;
      }
    } catch {
      // If corrupted or unreadable, stay idle
    }
    return false;
  }

  /**
   * Returns current operational status of the model subsystem.
   *
   * @returns {Object}
   */
  getStatus() {
    const datasetAvailable = fs.existsSync(this.datasetPath);
    const artifactAvailable = this.persistenceService.hasArtifact();

    return {
      datasetAvailable,
      trainingStatus: this.trainingStatus,
      isTraining: this.isTraining,
      modelLoaded: !!this.activeModel,
      selectedModel: this.selectedModelName,
      artifactAvailable,
    };
  }

  /**
   * Executes model training via ExperimentPipeline.
   *
   * @param {Object} [options]
   * @param {Array<Object>} [options.records] - In-memory records (for tests)
   * @param {string} [options.filePath] - Custom CSV path
   * @returns {Promise<Object>}
   */
  async train(options = {}) {
    if (this.isTraining) {
      const error = new Error('Training is already in progress. Concurrent training is prohibited.');
      error.statusCode = 409;
      throw error;
    }

    const records = options.records;
    const filePath = options.filePath || this.datasetPath;

    // Guard: Check if dataset is available
    if (!records && !fs.existsSync(path.resolve(filePath))) {
      return {
        datasetMissing: true,
        message: `Dataset file not found at ${filePath}. Training cannot proceed without real data.`,
      };
    }

    this.isTraining = true;
    this.trainingStatus = 'training';

    try {
      const pipeline = new ExperimentPipeline({
        seed: options.seed ?? 42,
        kFeatures: options.kFeatures ?? 50,
      });

      const result = await pipeline.run({ records, filePath });

      if (result.datasetMissing) {
        this.trainingStatus = 'idle';
        this.isTraining = false;
        return result;
      }

      // Populate active in-memory components for real-time inference
      this.activeModel = result.artifacts.model;
      this.activeVectorizer = result.artifacts.vectorizer;
      this.activeSelector = result.artifacts.selector;
      this.selectedModelName = result.bestModel.modelName;
      this.comparisonResults = result.comparisonResults;
      this.bestModelMetadata = result.bestModel;
      this.trainingStatus = 'trained';

      // Persist artifact to disk
      this.persistenceService.save({
        modelName: this.selectedModelName,
        model: this.activeModel,
        vectorizer: this.activeVectorizer,
        selector: this.activeSelector,
        metadata: this.bestModelMetadata,
        comparisonResults: this.comparisonResults,
      });

      return result;
    } catch (err) {
      this.trainingStatus = 'failed';
      throw err;
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Returns validation comparison results for all evaluated models.
   *
   * @returns {Object}
   */
  getComparison() {
    if (!this.comparisonResults && this.persistenceService.hasArtifact()) {
      this.loadFromDisk();
    }

    if (!this.comparisonResults) {
      return {
        status: 'not_trained',
        message: 'No models have been trained or loaded yet.',
        models: [],
        selectedModel: null,
      };
    }

    return {
      status: 'success',
      models: this.comparisonResults,
      selectedModel: this.selectedModelName,
      bestMetadata: this.bestModelMetadata,
    };
  }

  /**
   * Predicts disaster class for a single input text using the active loaded model.
   *
   * @param {string} text - Raw tweet text
   * @returns {Promise<Object>}
   */
  async predict(text) {
    if (!this.activeModel) {
      // Attempt lazy load
      this.loadFromDisk();
    }

    if (!this.activeModel || !this.activeVectorizer) {
      const error = new Error('No trained model is currently loaded. Please train or load a model first.');
      error.statusCode = 503;
      error.code = 'NO_MODEL_LOADED';
      throw error;
    }

    // Input Validation
    if (typeof text !== 'string') {
      const error = new Error('Input text must be a string.');
      error.statusCode = 422;
      throw error;
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      const error = new Error('Input text cannot be empty.');
      error.statusCode = 422;
      throw error;
    }

    if (trimmed.length > 5000) {
      const error = new Error('Input text exceeds maximum allowed length of 5000 characters.');
      error.statusCode = 422;
      throw error;
    }

    // Exact same transformation as training:
    // 1. Vectorize text with frozen vocabulary and IDF weights
    const XRaw = this.activeVectorizer.transform([trimmed]);

    // 2. Select features with frozen selector (if selector exists)
    let X = XRaw;
    if (this.activeSelector && this.activeSelector._isFitted) {
      X = this.activeSelector.transform(XRaw);
    }

    // 3. Classify
    const predictions = this.activeModel.predict(X);
    const pred = predictions[0];

    // 4. Confidence probabilities
    let probabilities = {
      not_disaster: pred === 0 ? 1.0 : 0.0,
      disaster: pred === 1 ? 1.0 : 0.0,
    };

    if (typeof this.activeModel.predictProba === 'function') {
      try {
        const probas = this.activeModel.predictProba(X);
        const p = probas[0];
        if (Array.isArray(p)) {
          probabilities = {
            not_disaster: Number(p[0].toFixed(4)),
            disaster: Number(p[1].toFixed(4)),
          };
        } else if (typeof p === 'number') {
          probabilities = {
            not_disaster: Number((1 - p).toFixed(4)),
            disaster: Number(p.toFixed(4)),
          };
        }
      } catch {
        // Fallback to discrete probability indicator
      }
    }

    return {
      text: trimmed,
      prediction: pred,
      label: pred === 1 ? 'Disaster' : 'Not Disaster',
      probabilities,
      model_name: this.selectedModelName,
    };
  }
}

export const modelService = new ModelService();
