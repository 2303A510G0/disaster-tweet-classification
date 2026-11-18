/**
 * naiveBayes.js — Multinomial Naive Bayes Classifier (T09)
 *
 * Mathematical formulation:
 *
 *   Prior:       log P(c) = log(|c| / N)
 *
 *   Likelihood (Laplace-smoothed):
 *     log P(t_j | c) = log( (count(t_j, c) + α) / (Σ_j count(t_j, c) + α · |V|) )
 *
 *   Prediction:  ĉ = argmax_c [ log P(c) + Σ_j x_j · log P(t_j | c) ]
 *
 * Usage:
 *   const nb = new MultinomialNaiveBayes({ alpha: 1 });
 *   nb.fit(X_train, y_train);
 *   const preds  = nb.predict(X_test);
 *   const probas = nb.predictProba(X_test);
 */

export class MultinomialNaiveBayes {
  /**
   * @param {object} options
   * @param {number} [options.alpha=1] - Laplace smoothing parameter (must be > 0).
   */
  constructor(options = {}) {
    this.alpha = options.alpha !== undefined ? options.alpha : 1.0;
    this._logPriors = null;       // [logP(c=0), logP(c=1)]
    this._logLikelihoods = null;  // [logLik_class0[], logLik_class1[]]
    this._numFeatures = null;
    this._isFitted = false;
  }

  // ─── public API ────────────────────────────────────────────────────────────

  /**
   * Fit the model on training documents.
   *
   * @param {number[][]} X - 2D dense count/TF-IDF matrix (must be non-negative).
   * @param {number[]}   y - Binary labels.
   * @returns {MultinomialNaiveBayes} this
   */
  fit(X, y) {
    if (this.alpha <= 0) {
      throw new RangeError(`alpha must be > 0, got ${this.alpha}.`);
    }
    _validateXy(X, y);

    const N = X.length;
    const nFeatures = X[0].length;
    this._numFeatures = nFeatures;

    const count0 = y.filter((l) => l === 0).length;
    const count1 = N - count0;

    // Log-priors
    this._logPriors = [Math.log(count0 / N), Math.log(count1 / N)];

    // Accumulate feature counts per class
    const featureSums = [new Array(nFeatures).fill(0), new Array(nFeatures).fill(0)];

    for (let i = 0; i < N; i++) {
      const cls = y[i] === 1 ? 1 : 0;
      for (let j = 0; j < nFeatures; j++) {
        featureSums[cls][j] += X[i][j];
      }
    }

    // Log-likelihoods with Laplace smoothing
    this._logLikelihoods = [null, null];
    for (const cls of [0, 1]) {
      const totalWords = featureSums[cls].reduce((s, v) => s + v, 0);
      const denom = totalWords + this.alpha * nFeatures;
      this._logLikelihoods[cls] = featureSums[cls].map(
        (count) => Math.log((count + this.alpha) / denom)
      );
    }

    this._isFitted = true;
    return this;
  }

  /**
   * Predict class labels.
   *
   * @param {number[][]} X
   * @returns {number[]}
   */
  predict(X) {
    this._assertFitted();
    _validateX(X, this._numFeatures);
    return this.predictLogProba(X).map(([lp0, lp1]) => (lp1 >= lp0 ? 1 : 0));
  }

  /**
   * Predict class probabilities using softmax over log-probs.
   *
   * @param {number[][]} X
   * @returns {[number, number][]} [[p0, p1], ...]
   */
  predictProba(X) {
    this._assertFitted();
    _validateX(X, this._numFeatures);
    return this.predictLogProba(X).map(([lp0, lp1]) => {
      // Numerically stable softmax: shift by max
      const maxLp = Math.max(lp0, lp1);
      const e0 = Math.exp(lp0 - maxLp);
      const e1 = Math.exp(lp1 - maxLp);
      const sum = e0 + e1;
      return [e0 / sum, e1 / sum];
    });
  }

  /**
   * Compute log-class-probabilities (unnormalized joint log-probs).
   *
   * @param {number[][]} X
   * @returns {[number, number][]} [[logP0, logP1], ...]
   */
  predictLogProba(X) {
    this._assertFitted();
    _validateX(X, this._numFeatures);
    return X.map((row) => {
      let lp0 = this._logPriors[0];
      let lp1 = this._logPriors[1];
      for (let j = 0; j < this._numFeatures; j++) {
        const xj = row[j];
        if (xj !== 0) {
          lp0 += xj * this._logLikelihoods[0][j];
          lp1 += xj * this._logLikelihoods[1][j];
        }
      }
      // Convert to actual log-probabilities via softmax
      const maxLp = Math.max(lp0, lp1);
      const e0 = Math.exp(lp0 - maxLp);
      const e1 = Math.exp(lp1 - maxLp);
      const logSum = Math.log(e0 + e1) + maxLp;
      return [lp0 - logSum, lp1 - logSum];
    });
  }

  // ─── private ───────────────────────────────────────────────────────────────

  _assertFitted() {
    if (!this._isFitted) {
      throw new Error('MultinomialNaiveBayes is not fitted. Call fit() before predict().');
    }
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function _validateXy(X, y) {
  if (!Array.isArray(X) || !Array.isArray(y)) {
    throw new TypeError('X and y must be arrays.');
  }
  if (X.length === 0 || y.length === 0) {
    throw new RangeError('X and y must not be empty.');
  }
  if (X.length !== y.length) {
    throw new RangeError(`X has ${X.length} rows but y has ${y.length} elements.`);
  }
}

function _validateX(X, expectedFeatures) {
  if (!Array.isArray(X) || X.length === 0) {
    throw new TypeError('X must be a non-empty 2D array.');
  }
  if (X[0].length !== expectedFeatures) {
    throw new RangeError(
      `Feature dimension mismatch: expected ${expectedFeatures}, got ${X[0].length}.`
    );
  }
}

