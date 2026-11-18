/**
 * featureSelector.js — Chi-Square Feature Selection (T09)
 *
 * Implements ChiSquareSelector using the standard 2×2 contingency table approach.
 * Because the input matrix may contain TF-IDF floats (non-negative), features are
 * binarized (presence / absence) before the chi-square statistic is computed.
 *
 * χ²(j) = Σ [ (O - E)² / E ]   (cells where E = 0 are skipped)
 *
 * Usage:
 *   const sel = new ChiSquareSelector({ k: 50 });
 *   sel.fit(X_train, y_train);
 *   const X_sel = sel.transform(X_test);
 */

export class ChiSquareSelector {
  /**
   * @param {object} options
   * @param {number} options.k - Number of top features to select.
   */
  constructor(options = {}) {
    this.k = options.k ?? 100;
    this._scores = null;          // chi-square score per feature
    this._selectedIndices = null; // top-k feature column indices (sorted ascending)
    this._isFitted = false;
  }

  // ─── public API ────────────────────────────────────────────────────────────

  /**
   * Fit the selector by computing chi-square scores for every feature.
   *
   * @param {number[][]} X - 2D dense feature matrix (n_docs × n_features).
   * @param {number[]}   y - Binary label array of length n_docs.
   * @returns {ChiSquareSelector} this
   */
  fit(X, y) {
    _validateXy(X, y);

    const nDocs = X.length;
    const nFeatures = X[0].length;

    if (this.k > nFeatures) {
      throw new RangeError(
        `k (${this.k}) cannot exceed the number of features (${nFeatures}).`
      );
    }

    const scores = new Array(nFeatures).fill(0);

    for (let j = 0; j < nFeatures; j++) {
      // Binarize column j: 1 if feature value > 0, else 0
      let A = 0, B = 0, C = 0, D = 0; // 2×2 contingency counts
      for (let i = 0; i < nDocs; i++) {
        const present = X[i][j] > 0 ? 1 : 0;
        const label   = y[i] === 1  ? 1 : 0;
        if (present && label)      A++;
        else if (present && !label) B++;
        else if (!present && label) C++;
        else                        D++;
      }

      // Marginals
      const N  = nDocs;
      const r1 = A + B; // row: feature present
      const r2 = C + D; // row: feature absent
      const c1 = A + C; // col: class 1
      const c2 = B + D; // col: class 0

      // Expected counts
      const E_A = (r1 * c1) / N;
      const E_B = (r1 * c2) / N;
      const E_C = (r2 * c1) / N;
      const E_D = (r2 * c2) / N;

      // χ² accumulate (skip zero-expectation cells)
      let chi2 = 0;
      if (E_A > 0) chi2 += (A - E_A) ** 2 / E_A;
      if (E_B > 0) chi2 += (B - E_B) ** 2 / E_B;
      if (E_C > 0) chi2 += (C - E_C) ** 2 / E_C;
      if (E_D > 0) chi2 += (D - E_D) ** 2 / E_D;

      scores[j] = chi2;
    }

    this._scores = scores;

    // Rank features: sort indices by score descending, breaking ties by original index (stable)
    const ranked = scores
      .map((score, idx) => ({ score, idx }))
      .sort((a, b) => b.score - a.score || a.idx - b.idx);

    // Take top-k and sort ascending so column slicing is consistent
    this._selectedIndices = ranked
      .slice(0, this.k)
      .map((item) => item.idx)
      .sort((a, b) => a - b);

    this._isFitted = true;
    return this;
  }

  /**
   * Transform matrix by selecting only the top-k feature columns.
   *
   * @param {number[][]} X - 2D dense feature matrix.
   * @returns {number[][]} Reduced matrix with k columns.
   */
  transform(X) {
    if (!this._isFitted) {
      throw new Error('ChiSquareSelector is not fitted. Call fit() before transform().');
    }
    if (!Array.isArray(X)) {
      throw new TypeError('X must be a 2D array.');
    }

    const indices = this._selectedIndices;
    return X.map((row) => indices.map((j) => row[j]));
  }

  /**
   * Fit and transform in one step.
   *
   * @param {number[][]} X
   * @param {number[]}   y
   * @returns {number[][]}
   */
  fitTransform(X, y) {
    return this.fit(X, y).transform(X);
  }

  /**
   * @returns {number[]} A copy of the chi-square score array.
   */
  getScores() {
    if (!this._isFitted) {
      throw new Error('ChiSquareSelector is not fitted.');
    }
    return [...this._scores];
  }

  /**
   * @returns {number[]} A copy of the selected feature indices (ascending order).
   */
  getSelectedFeatures() {
    if (!this._isFitted) {
      throw new Error('ChiSquareSelector is not fitted.');
    }
    return [...this._selectedIndices];
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
    throw new RangeError(
      `X has ${X.length} rows but y has ${y.length} elements.`
    );
  }
}

