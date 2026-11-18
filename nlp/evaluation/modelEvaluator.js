/**
 * modelEvaluator.js — Model Evaluator (T10)
 *
 * Evaluates already-trained classifier models on validation or test datasets
 * without mutating model state, tuning hyperparameters, or fitting.
 */

import { classificationReport } from './metrics.js';

const EPS = 1e-15;

export class ModelEvaluator {
  /**
   * Evaluates an already-fitted model on feature matrix X and ground truth y.
   *
   * @param {Object} model - Object implementing predict(X) and optionally predictProba(X).
   * @param {number[][]} X - Feature matrix.
   * @param {number[]} y - True binary labels.
   * @returns {Object} Comprehensive evaluation metrics report.
   */
  evaluate(model, X, y) {
    if (!model || typeof model.predict !== 'function') {
      throw new TypeError('Model must implement a predict(X) method.');
    }

    const yPred = model.predict(X);
    const report = this.evaluatePredictions(y, yPred);

    if (typeof model.predictProba === 'function') {
      try {
        const probas = model.predictProba(X);
        const probaMetrics = this.evaluateProbabilities(y, probas);
        report.logLoss = probaMetrics.logLoss;
        report.brierScore = probaMetrics.brierScore;
      } catch {
        // Soft fail if predictProba fails or outputs unsupported shape
      }
    }

    return report;
  }

  /**
   * Evaluates discrete predictions against ground truth labels.
   *
   * @param {number[]} yTrue
   * @param {number[]} yPred
   * @returns {Object} Classification report.
   */
  evaluatePredictions(yTrue, yPred) {
    return classificationReport(yTrue, yPred);
  }

  /**
   * Evaluates predicted probabilities against ground truth labels.
   *
   * @param {number[]} yTrue - Ground truth binary labels (0 or 1).
   * @param {number[]|Array<[number, number]>} probabilities - P(y=1) or [P(y=0), P(y=1)].
   * @returns {{ logLoss: number, brierScore: number }}
   */
  evaluateProbabilities(yTrue, probabilities) {
    if (!Array.isArray(yTrue) || !Array.isArray(probabilities)) {
      throw new TypeError('yTrue and probabilities must be arrays.');
    }
    if (yTrue.length !== probabilities.length) {
      throw new RangeError('yTrue and probabilities must have the same length.');
    }
    if (yTrue.length === 0) {
      throw new RangeError('Arrays must not be empty.');
    }

    const N = yTrue.length;
    let totalLogLoss = 0;
    let totalBrier = 0;

    for (let i = 0; i < N; i++) {
      const yt = Number(yTrue[i]);
      if (yt !== 0 && yt !== 1) {
        throw new RangeError(`Invalid ground truth label at index ${i}: ${yTrue[i]}. Expected 0 or 1.`);
      }

      let p1;
      const prob = probabilities[i];
      if (Array.isArray(prob)) {
        if (prob.length !== 2) {
          throw new RangeError('Probability pair must contain exactly 2 elements [p0, p1].');
        }
        p1 = Number(prob[1]);
      } else {
        p1 = Number(prob);
      }

      if (Number.isNaN(p1) || p1 < 0 || p1 > 1) {
        throw new RangeError(`Probability at index ${i} is out of bounds [0, 1]: ${p1}`);
      }

      // Numerical stability
      const clampedP = Math.max(EPS, Math.min(1 - EPS, p1));
      totalLogLoss -= yt * Math.log(clampedP) + (1 - yt) * Math.log(1 - clampedP);
      totalBrier += (p1 - yt) ** 2;
    }

    return {
      logLoss: totalLogLoss / N,
      brierScore: totalBrier / N,
    };
  }
}
