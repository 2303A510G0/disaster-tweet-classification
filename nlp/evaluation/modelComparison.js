/**
 * modelComparison.js — Model Comparison Utility (T10)
 *
 * Trains and evaluates classical models (DummyClassifier, MultinomialNaiveBayes, LogisticRegression)
 * strictly on training and validation sets.
 * Does NOT access test data.
 */

import { DummyClassifier } from '../models/baselineClassifier.js';
import { MultinomialNaiveBayes } from '../models/naiveBayes.js';
import { LogisticRegression } from '../models/logisticRegression.js';
import { ModelEvaluator } from './modelEvaluator.js';

export class ModelComparison {
  constructor(options = {}) {
    this.evaluator = options.evaluator || new ModelEvaluator();
    this.modelConfigs = options.modelConfigs || {
      dummy: {},
      naiveBayes: { alpha: 1.0 },
      logisticRegression: { learningRate: 0.1, epochs: 200, lambda: 0.01 },
    };
  }

  /**
   * Fits all candidate models on (X_train, y_train) and evaluates them on (X_val, y_val).
   *
   * @param {number[][]} X_train
   * @param {number[]} y_train
   * @param {number[][]} X_val
   * @param {number[]} y_val
   * @returns {Promise<Array<Object>>} Comparison table sorted deterministically.
   */
  async compare(X_train, y_train, X_val, y_val) {
    if (!Array.isArray(X_train) || !Array.isArray(y_train) || !Array.isArray(X_val) || !Array.isArray(y_val)) {
      throw new TypeError('All datasets must be arrays.');
    }

    const modelsToEvaluate = [
      {
        name: 'DummyClassifier (Baseline)',
        isBaseline: true,
        instance: new DummyClassifier(this.modelConfigs.dummy),
      },
      {
        name: 'MultinomialNaiveBayes',
        isBaseline: false,
        instance: new MultinomialNaiveBayes(this.modelConfigs.naiveBayes),
      },
      {
        name: 'LogisticRegression',
        isBaseline: false,
        instance: new LogisticRegression(this.modelConfigs.logisticRegression),
      },
    ];

    const results = [];

    for (const m of modelsToEvaluate) {
      // 1. Train on training data ONLY
      m.instance.fit(X_train, y_train);

      // 2. Evaluate on validation data
      const evalMetrics = this.evaluator.evaluate(m.instance, X_val, y_val);

      results.push({
        modelName: m.name,
        isBaseline: m.isBaseline,
        accuracy: evalMetrics.accuracy,
        precision: evalMetrics.precision,
        recall: evalMetrics.recall,
        f1: evalMetrics.f1,
        confusionMatrix: evalMetrics.confusionMatrix,
        perClass: evalMetrics.perClass,
        macroAvg: evalMetrics.macroAvg,
        weightedAvg: evalMetrics.weightedAvg,
        model: m.instance,
      });
    }

    return results;
  }

  /**
   * Selects the best performing model based on a validation metric (default: 'f1').
   *
   * @param {Array<Object>} comparisonResults
   * @param {string} [criterion='f1']
   * @returns {Object} Best model result entry.
   */
  getBestModel(comparisonResults, criterion = 'f1') {
    if (!Array.isArray(comparisonResults) || comparisonResults.length === 0) {
      throw new RangeError('comparisonResults must be a non-empty array.');
    }

    let best = comparisonResults[0];
    for (let i = 1; i < comparisonResults.length; i++) {
      const candidate = comparisonResults[i];
      if (candidate[criterion] > best[criterion]) {
        best = candidate;
      }
    }

    return best;
  }
}
