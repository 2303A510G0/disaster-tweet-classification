/**
 * logisticRegression.js — Binary Logistic Regression via Gradient Descent (T09)
 *
 * Mathematical formulation:
 *
 *   Sigmoid:    σ(z) = 1 / (1 + exp(-clamp(z, -500, 500)))
 *
 *   Forward:    z   = X · w + b
 *               ŷ   = σ(z)
 *
 *   Loss (BCE): L = -1/N · Σ [ y·log(ŷ+ε) + (1-y)·log(1-ŷ+ε) ]
 *
 *   Gradient:   ∂L/∂w = (1/N) · Xᵀ·(ŷ-y) + λ·w    (L2 regularisation; bias unregularised)
 *               ∂L/∂b = mean(ŷ-y)
 *
 *   Update:     w ← w - α·∂L/∂w
 *               b ← b - α·∂L/∂b
 *
 * Usage:
 *   const lr = new LogisticRegression({ learningRate: 0.1, epochs: 100, lambda: 0.01 });
 *   lr.fit(X_train, y_train);
 *   const preds  = lr.predict(X_test);           // binary labels
 *   const probas = lr.predictProba(X_test);       // sigmoid scores ∈ [0,1]
 *   const scores = lr.decisionFunction(X_test);   // linear scores X·w+b
 */

const EPS = 1e-15; // numerical guard for log(0)

export class LogisticRegression {
  /**
   * @param {object} options
   * @param {number} [options.learningRate=0.1]
   * @param {number} [options.epochs=100]
   * @param {number} [options.lambda=0.01]  - L2 regularisation strength
   * @param {number} [options.seed=42]      - Reserved for future stochastic extensions
   */
  constructor(options = {}) {
    this.learningRate = options.learningRate ?? 0.1;
    this.epochs       = options.epochs       ?? 100;
    this.lambda       = options.lambda       ?? 0.01;
    this.seed         = options.seed         ?? 42;

    this.weights     = null;  // Float64Array or plain array after fit
    this.bias        = 0;
    this.lossHistory = [];
    this._numFeatures = null;
    this._isFitted    = false;
  }

  // ─── public API ────────────────────────────────────────────────────────────

  /**
   * Train the model using full-batch gradient descent.
   *
   * @param {number[][]} X - 2D dense feature matrix.
   * @param {number[]}   y - Binary labels (0 or 1).
   * @returns {LogisticRegression} this
   */
  fit(X, y) {
    _validateXy(X, y);

    const N = X.length;
    const nFeatures = X[0].length;
    this._numFeatures = nFeatures;

    // Deterministic initialisation to zeros
    this.weights = new Array(nFeatures).fill(0);
    this.bias    = 0;
    this.lossHistory = [];

    for (let epoch = 0; epoch < this.epochs; epoch++) {
      // Forward pass
      const z    = _matVecAdd(X, this.weights, this.bias); // X·w + b
      const yHat = z.map(_sigmoid);                         // σ(z)

      // Binary cross-entropy loss
      let loss = 0;
      for (let i = 0; i < N; i++) {
        loss -= y[i] * Math.log(yHat[i] + EPS) + (1 - y[i]) * Math.log(1 - yHat[i] + EPS);
      }
      loss /= N;
      this.lossHistory.push(loss);

      // Residuals: (ŷ - y)
      const residuals = yHat.map((p, i) => p - y[i]);

      // Gradient of weights: (1/N) Xᵀ·residuals + λ·w
      const dW = _xTransposeVec(X, residuals, N);
      for (let j = 0; j < nFeatures; j++) {
        dW[j] += this.lambda * this.weights[j];
      }

      // Gradient of bias: mean(residuals)
      const dB = residuals.reduce((s, r) => s + r, 0) / N;

      // Parameter update
      for (let j = 0; j < nFeatures; j++) {
        this.weights[j] -= this.learningRate * dW[j];
      }
      this.bias -= this.learningRate * dB;
    }

    this._isFitted = true;
    return this;
  }

  /**
   * Predict binary class labels (threshold at 0.5).
   *
   * @param {number[][]} X
   * @returns {number[]}
   */
  predict(X) {
    this._assertFitted();
    _validateX(X, this._numFeatures);
    return this.predictProba(X).map((p) => (p >= 0.5 ? 1 : 0));
  }

  /**
   * Predict P(y=1|X) using the sigmoid function.
   *
   * @param {number[][]} X
   * @returns {number[]}
   */
  predictProba(X) {
    this._assertFitted();
    _validateX(X, this._numFeatures);
    return this.decisionFunction(X).map(_sigmoid);
  }

  /**
   * Compute the raw linear decision scores X·w + b.
   *
   * @param {number[][]} X
   * @returns {number[]}
   */
  decisionFunction(X) {
    this._assertFitted();
    _validateX(X, this._numFeatures);
    return _matVecAdd(X, this.weights, this.bias);
  }

  // ─── private ───────────────────────────────────────────────────────────────

  _assertFitted() {
    if (!this._isFitted) {
      throw new Error('LogisticRegression is not fitted. Call fit() before predict().');
    }
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Numerically stable sigmoid */
function _sigmoid(z) {
  const clamped = Math.max(-500, Math.min(500, z));
  return 1 / (1 + Math.exp(-clamped));
}

/** Compute X·w + b for each row → number[] */
function _matVecAdd(X, w, b) {
  return X.map((row) => {
    let sum = b;
    for (let j = 0; j < w.length; j++) {
      sum += row[j] * w[j];
    }
    return sum;
  });
}

/** Compute (1/N) · Xᵀ·v → number[] (gradient w.r.t. weights) */
function _xTransposeVec(X, v, N) {
  const nFeatures = X[0].length;
  const result = new Array(nFeatures).fill(0);
  for (let i = 0; i < X.length; i++) {
    for (let j = 0; j < nFeatures; j++) {
      result[j] += X[i][j] * v[i];
    }
  }
  for (let j = 0; j < nFeatures; j++) {
    result[j] /= N;
  }
  return result;
}

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

