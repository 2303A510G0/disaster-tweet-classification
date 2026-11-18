/**
 * modelPersistenceService.js — Model Artifact Persistence Layer (T11)
 *
 * Persists and reconstructs trained NLP pipeline components:
 * - TfidfVectorizer (vocabulary, IDF weights, feature names, options)
 * - ChiSquareSelector (k, scores, selected column indices)
 * - Classifiers (DummyClassifier, MultinomialNaiveBayes, LogisticRegression)
 * - Experiment metadata and comparison results
 *
 * Uses atomic JSON writes (temp file + rename) and strict deserialization validation
 * without executing arbitrary JavaScript code or using eval.
 */

import fs from 'fs';
import path from 'path';
import { TfidfVectorizer } from '../../../nlp/features/tfidfVectorizer.js';
import { ChiSquareSelector } from '../../../nlp/features/featureSelector.js';
import { DummyClassifier } from '../../../nlp/models/baselineClassifier.js';
import { MultinomialNaiveBayes } from '../../../nlp/models/naiveBayes.js';
import { LogisticRegression } from '../../../nlp/models/logisticRegression.js';

export class ModelPersistenceService {
  constructor(options = {}) {
    this.artifactDir = path.resolve(options.artifactDir || 'artifacts/models');
    this.artifactFileName = options.artifactFileName || 'model_artifact.json';
    this.artifactPath = path.join(this.artifactDir, this.artifactFileName);
  }

  /**
   * Checks whether a persisted model artifact exists on disk.
   *
   * @returns {boolean}
   */
  hasArtifact() {
    return fs.existsSync(this.artifactPath);
  }

  /**
   * Serializes and atomically saves the trained model pipeline.
   *
   * @param {Object} payload
   * @param {string} payload.modelName
   * @param {Object} payload.model - Model instance
   * @param {TfidfVectorizer} payload.vectorizer - Fitted vectorizer instance
   * @param {ChiSquareSelector|null} [payload.selector] - Fitted selector instance
   * @param {Object} [payload.metadata] - Extra experiment metrics
   * @param {Array} [payload.comparisonResults] - Comparison table
   * @returns {{ success: boolean, filePath: string }}
   */
  save({ modelName, model, vectorizer, selector = null, metadata = {}, comparisonResults = [] }) {
    if (!model || !vectorizer) {
      throw new Error('Cannot persist model artifact: model and vectorizer are required.');
    }

    // Ensure target directory exists
    if (!fs.existsSync(this.artifactDir)) {
      fs.mkdirSync(this.artifactDir, { recursive: true });
    }

    // 1. Serialize Vectorizer
    const vectorizerData = {
      options: {
        ngramRange: vectorizer.ngramRange,
        minDf: vectorizer.minDf,
        maxFeatures: vectorizer.maxFeatures,
        sublinearTf: vectorizer.sublinearTf,
        norm: vectorizer.norm,
        smoothIdf: vectorizer.smoothIdf,
        lowercase: vectorizer.lowercase,
        removeStopWords: vectorizer.removeStopWords,
        stemming: vectorizer.stemming,
        preserveNegation: vectorizer.preserveNegation,
      },
      vocabulary: Array.from(vectorizer.vocabulary.entries()),
      featureNames: vectorizer.featureNames,
      documentFrequencies: vectorizer.documentFrequencies,
      idfWeights: vectorizer.idfWeights,
      nTrainingDocs: vectorizer.nTrainingDocs,
    };

    // 2. Serialize Feature Selector
    let selectorData = null;
    if (selector && selector._isFitted) {
      selectorData = {
        k: selector.k,
        scores: selector._scores,
        selectedIndices: selector._selectedIndices,
      };
    }

    // 3. Serialize Model Parameters
    let modelType = modelName;
    const modelParams = {};

    if (model instanceof DummyClassifier || modelName.includes('Dummy')) {
      modelType = 'DummyClassifier';
      modelParams._majorityClass = model._majorityClass;
      modelParams._p0 = model._p0;
      modelParams._p1 = model._p1;
    } else if (model instanceof MultinomialNaiveBayes || modelName.includes('NaiveBayes')) {
      modelType = 'MultinomialNaiveBayes';
      modelParams.alpha = model.alpha;
      modelParams._logPriors = model._logPriors;
      modelParams._logLikelihoods = model._logLikelihoods;
      modelParams._numFeatures = model._numFeatures;
    } else if (model instanceof LogisticRegression || modelName.includes('Logistic')) {
      modelType = 'LogisticRegression';
      modelParams.learningRate = model.learningRate;
      modelParams.epochs = model.epochs;
      modelParams.lambda = model.lambda;
      modelParams.seed = model.seed;
      modelParams.weights = model.weights;
      modelParams.bias = model.bias;
      modelParams.lossHistory = model.lossHistory;
      modelParams._numFeatures = model._numFeatures;
    } else {
      throw new Error(`Unsupported model type for persistence: ${modelName}`);
    }

    const artifact = {
      version: '1.0.0',
      savedAt: new Date().toISOString(),
      modelName,
      metadata,
      vectorizer: vectorizerData,
      selector: selectorData,
      model: {
        type: modelType,
        params: modelParams,
      },
      comparisonResults,
    };

    // Atomic write via temporary file
    const tempPath = `${this.artifactPath}.${Date.now()}.tmp`;
    const serialized = JSON.stringify(artifact, null, 2);

    fs.writeFileSync(tempPath, serialized, 'utf-8');
    fs.renameSync(tempPath, this.artifactPath);

    return {
      success: true,
      filePath: this.artifactPath,
    };
  }

  /**
   * Safely loads and reconstructs the trained NLP pipeline artifact from disk.
   *
   * @returns {Object|null} Reconstructed pipeline instances or null if not found.
   */
  load() {
    if (!this.hasArtifact()) {
      return null;
    }

    let parsed;
    try {
      const raw = fs.readFileSync(this.artifactPath, 'utf-8');
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Corrupted model artifact at ${this.artifactPath}: ${err.message}`);
    }

    if (!parsed || !parsed.vectorizer || !parsed.model) {
      throw new Error(`Corrupted model artifact: missing critical vectorizer or model section.`);
    }

    // 1. Reconstruct TfidfVectorizer with integrity checks
    const vData = parsed.vectorizer;
    if (
      !Array.isArray(vData.vocabulary) ||
      !Array.isArray(vData.featureNames) ||
      !Array.isArray(vData.idfWeights)
    ) {
      throw new Error('Corrupted model artifact: missing or invalid vectorizer arrays.');
    }

    if (!vData.idfWeights.every(Number.isFinite)) {
      throw new Error('Corrupted model artifact: non-finite idf weights.');
    }

    const vectorizer = new TfidfVectorizer(vData.options);
    vectorizer.vocabulary = new Map(vData.vocabulary);
    vectorizer.featureNames = [...vData.featureNames];
    vectorizer.documentFrequencies = [...(vData.documentFrequencies || [])];
    vectorizer.idfWeights = [...vData.idfWeights];
    vectorizer.nTrainingDocs = vData.nTrainingDocs || 0;
    vectorizer.isFitted = true;

    // 2. Reconstruct ChiSquareSelector (if present) with integrity checks
    let selector = null;
    if (parsed.selector) {
      const sData = parsed.selector;
      if (
        !Array.isArray(sData.scores) ||
        !Array.isArray(sData.selectedIndices) ||
        !sData.scores.every(Number.isFinite)
      ) {
        throw new Error('Corrupted model artifact: invalid or non-finite selector arrays.');
      }

      selector = new ChiSquareSelector({ k: sData.k });
      selector._scores = [...sData.scores];
      selector._selectedIndices = [...sData.selectedIndices];
      selector._isFitted = true;
    }

    const expectedFeatures = selector ? selector.k : vectorizer.featureNames.length;

    // 3. Reconstruct Model Instance with integrity & dimension checks
    let model;
    const mData = parsed.model;
    if (!mData || !mData.params) {
      throw new Error('Corrupted model artifact: missing model configuration parameters.');
    }

    if (mData.type === 'DummyClassifier') {
      model = new DummyClassifier();
      model._majorityClass = mData.params._majorityClass;
      model._p0 = mData.params._p0;
      model._p1 = mData.params._p1;
      model._isFitted = true;
    } else if (mData.type === 'MultinomialNaiveBayes') {
      if (
        !Array.isArray(mData.params._logPriors) ||
        !mData.params._logPriors.every(Number.isFinite) ||
        !Array.isArray(mData.params._logLikelihoods) ||
        mData.params._logLikelihoods.length !== 2
      ) {
        throw new Error('Corrupted model artifact: invalid or non-finite Naive Bayes parameters.');
      }

      if (mData.params._logLikelihoods[0].length !== expectedFeatures) {
        throw new Error(
          `Dimension mismatch: Naive Bayes feature count (${mData.params._logLikelihoods[0].length}) does not match expected feature count (${expectedFeatures}).`
        );
      }

      model = new MultinomialNaiveBayes({ alpha: mData.params.alpha });
      model._logPriors = [...mData.params._logPriors];
      model._logLikelihoods = mData.params._logLikelihoods.map((row) => [...row]);
      model._numFeatures = mData.params._numFeatures || expectedFeatures;
      model._isFitted = true;
    } else if (mData.type === 'LogisticRegression') {
      if (
        !Array.isArray(mData.params.weights) ||
        !mData.params.weights.every(Number.isFinite) ||
        !Number.isFinite(mData.params.bias)
      ) {
        throw new Error('Corrupted model artifact: non-finite Logistic Regression weights or bias.');
      }

      if (mData.params.weights.length !== expectedFeatures) {
        throw new Error(
          `Dimension mismatch: model weights length (${mData.params.weights.length}) does not match expected feature count (${expectedFeatures}).`
        );
      }

      model = new LogisticRegression({
        learningRate: mData.params.learningRate,
        epochs: mData.params.epochs,
        lambda: mData.params.lambda,
        seed: mData.params.seed,
      });
      model.weights = [...mData.params.weights];
      model.bias = mData.params.bias;
      model.lossHistory = [...(mData.params.lossHistory || [])];
      model._numFeatures = mData.params._numFeatures || expectedFeatures;
      model._isFitted = true;
    } else {
      throw new Error(`Cannot load artifact: unrecognized model type '${mData.type}'`);
    }

    return {
      modelName: parsed.modelName,
      model,
      vectorizer,
      selector,
      metadata: parsed.metadata || {},
      comparisonResults: parsed.comparisonResults || [],
      savedAt: parsed.savedAt,
    };
  }
}

export const modelPersistenceService = new ModelPersistenceService();

