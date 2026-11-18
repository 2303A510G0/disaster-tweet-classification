/**
 * baselineClassifier.js — Majority-Class Dummy Classifier (T09)
 *
 * Implements the simplest possible baseline: predict the majority class for
 * every document, regardless of its content.
 *
 * Usage:
 *   const clf = new DummyClassifier();
 *   clf.fit(X_train, y_train);
 *   const preds  = clf.predict(X_test);
 *   const probas = clf.predictProba(X_test); // → [[p0, p1], ...]
 */

export class DummyClassifier {
  constructor() {
    this._majorityClass = null;
    this._p0 = 0; // proportion of class 0 in training labels
    this._p1 = 0; // proportion of class 1 in training labels
    this._isFitted = false;
  }

  // ─── public API ────────────────────────────────────────────────────────────

  /**
   * Determine the majority class from training labels.
   *
   * @param {number[][]} _X  - Feature matrix (unused; accepted for API symmetry).
   * @param {number[]}    y  - Binary training labels (0 or 1).
   * @returns {DummyClassifier} this
   */
  fit(_X, y) {
    if (!Array.isArray(y) || y.length === 0) {
      throw new RangeError('y must be a non-empty array of labels.');
    }

    const count1 = y.filter((label) => label === 1).length;
    const count0 = y.length - count1;
    const N = y.length;

    this._p0 = count0 / N;
    this._p1 = count1 / N;

    // Tie-break: prefer class 0 (count1 must STRICTLY exceed count0 to win)
    this._majorityClass = count1 > count0 ? 1 : 0;

    this._isFitted = true;
    return this;
  }

  /**
   * Predict the majority class for every document in X.
   *
   * @param {number[][]} X - Feature matrix.
   * @returns {number[]} Array of predicted labels.
   */
  predict(X) {
    this._assertFitted();
    if (!Array.isArray(X)) {
      throw new TypeError('X must be an array.');
    }
    return new Array(X.length).fill(this._majorityClass);
  }

  /**
   * Predict class probabilities for every document.
   * Returns the same training proportions regardless of input.
   *
   * @param {number[][]} X - Feature matrix.
   * @returns {[number, number][]} Array of [p0, p1] pairs.
   */
  predictProba(X) {
    this._assertFitted();
    if (!Array.isArray(X)) {
      throw new TypeError('X must be an array.');
    }
    return new Array(X.length).fill(null).map(() => [this._p0, this._p1]);
  }

  // ─── private ───────────────────────────────────────────────────────────────

  _assertFitted() {
    if (!this._isFitted) {
      throw new Error('DummyClassifier is not fitted. Call fit() before predict().');
    }
  }
}

