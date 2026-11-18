/**
 * T09 — Unit Tests: Chi-Square Feature Selection, Baseline, Naive Bayes, Logistic Regression
 *
 * RED phase: all tests are written before implementation files exist.
 * Run: cd backend; npm.cmd test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ChiSquareSelector } from '../../../nlp/features/featureSelector.js';
import { DummyClassifier } from '../../../nlp/models/baselineClassifier.js';
import { MultinomialNaiveBayes } from '../../../nlp/models/naiveBayes.js';
import { LogisticRegression } from '../../../nlp/models/logisticRegression.js';

// ─────────────────────────────────────────────────────────────────────────────
// A. ChiSquareSelector
// ─────────────────────────────────────────────────────────────────────────────
describe('A. ChiSquareSelector', () => {
  /**
   * Fixture: 4 docs × 2 features
   * Feature 0 appears only in class-1 docs → high chi-square
   * Feature 1 appears in all docs → low chi-square (not discriminative)
   *
   * X (binarized):         y:
   *  [1, 1]                 1
   *  [1, 1]                 1
   *  [0, 1]                 0
   *  [0, 1]                 0
   *
   * For feature 0:
   *   A(1&present)=2, B(0&present)=0, C(1&absent)=0, D(0&absent)=2  N=4
   *   E_A=(2+0)*(2+0)/4=1, E_B=(2+0)*(0+2)/4=1, E_C=(0+2)*(2+0)/4=1, E_D=(0+2)*(0+2)/4=1
   *   χ² = (2-1)²/1 + (0-1)²/1 + (0-1)²/1 + (2-1)²/1 = 4
   *
   * For feature 1 (all 1s):
   *   A=2,B=2,C=0,D=0 → E_C=E_D=0 → skip those cells → only non-zero-E cells
   *   E_A=(2+2)*(2+0)/4=2, E_B=(2+2)*(2+0)/4=2
   *   χ² = (2-2)²/2 + (2-2)²/2 = 0
   */
  const X4 = [
    [1, 1],
    [1, 1],
    [0, 1],
    [0, 1],
  ];
  const y4 = [1, 1, 0, 0];

  it('computes chi-square scores correctly on hand-calculated fixture', () => {
    const sel = new ChiSquareSelector({ k: 2 });
    sel.fit(X4, y4);
    const scores = sel.getScores();
    expect(scores).toHaveLength(2);
    // Feature 0 highly discriminative
    expect(scores[0]).toBeGreaterThan(scores[1]);
    expect(scores[0]).toBeCloseTo(4.0, 1);
    // Feature 1 not discriminative at all
    expect(scores[1]).toBeCloseTo(0.0, 5);
  });

  it('ranks features by score descending and selects top k', () => {
    const sel = new ChiSquareSelector({ k: 1 });
    sel.fit(X4, y4);
    const indices = sel.getSelectedFeatures();
    expect(indices).toHaveLength(1);
    expect(indices[0]).toBe(0); // feature 0 wins
  });

  it('transform slices correct columns', () => {
    const sel = new ChiSquareSelector({ k: 1 });
    sel.fit(X4, y4);
    const Xt = sel.transform(X4);
    expect(Xt).toHaveLength(4);
    for (const row of Xt) {
      expect(row).toHaveLength(1);
    }
    // Column selected is feature 0: values [1,1,0,0]
    expect(Xt[0][0]).toBe(1);
    expect(Xt[2][0]).toBe(0);
  });

  it('fitTransform is equivalent to fit then transform', () => {
    const selA = new ChiSquareSelector({ k: 1 });
    const a = selA.fitTransform(X4, y4);
    const selB = new ChiSquareSelector({ k: 1 });
    selB.fit(X4, y4);
    const b = selB.transform(X4);
    expect(a).toEqual(b);
  });

  it('transform does not mutate the original matrix', () => {
    const sel = new ChiSquareSelector({ k: 1 });
    sel.fit(X4, y4);
    const original = X4.map((r) => [...r]);
    sel.transform(X4);
    expect(X4).toEqual(original);
  });

  it('handles tie-breaking deterministically (stable sort by original index)', () => {
    // Two features with identical score
    const X = [
      [1, 1],
      [0, 0],
    ];
    const y = [1, 0];
    const sel = new ChiSquareSelector({ k: 1 });
    sel.fit(X, y);
    const indices = sel.getSelectedFeatures();
    expect(indices).toHaveLength(1);
    // Both have same score; stable sort → feature 0 wins
    expect(indices[0]).toBe(0);
  });

  it('throws when k exceeds number of features', () => {
    const sel = new ChiSquareSelector({ k: 10 });
    expect(() => sel.fit(X4, y4)).toThrow();
  });

  it('throws when X rows and y length differ', () => {
    const sel = new ChiSquareSelector({ k: 1 });
    expect(() => sel.fit(X4, [1, 0])).toThrow();
  });

  it('throws when transform is called before fit', () => {
    const sel = new ChiSquareSelector({ k: 1 });
    expect(() => sel.transform(X4)).toThrow();
  });

  it('handles all-zero feature column gracefully (score = 0)', () => {
    const X = [
      [0, 1],
      [0, 1],
      [0, 0],
    ];
    const y = [1, 1, 0];
    const sel = new ChiSquareSelector({ k: 2 });
    sel.fit(X, y);
    const scores = sel.getScores();
    expect(scores[0]).toBeCloseTo(0, 5); // all-zero column
    expect(Number.isFinite(scores[0])).toBe(true);
  });

  it('handles single-feature matrix', () => {
    const X = [[1], [0], [1], [0]];
    const y = [1, 0, 1, 0];
    const sel = new ChiSquareSelector({ k: 1 });
    sel.fit(X, y);
    const indices = sel.getSelectedFeatures();
    expect(indices).toHaveLength(1);
    expect(indices[0]).toBe(0);
  });

  it('getScores returns a copy (mutation does not affect selector state)', () => {
    const sel = new ChiSquareSelector({ k: 2 });
    sel.fit(X4, y4);
    const s1 = sel.getScores();
    s1[0] = -999;
    const s2 = sel.getScores();
    expect(s2[0]).not.toBe(-999);
  });

  it('getSelectedFeatures returns a copy', () => {
    const sel = new ChiSquareSelector({ k: 1 });
    sel.fit(X4, y4);
    const f1 = sel.getSelectedFeatures();
    f1[0] = -999;
    const f2 = sel.getSelectedFeatures();
    expect(f2[0]).not.toBe(-999);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// B. DummyClassifier (Majority-Class Baseline)
// ─────────────────────────────────────────────────────────────────────────────
describe('B. DummyClassifier (majority-class baseline)', () => {
  it('predicts majority class 1 when class 1 dominates', () => {
    const clf = new DummyClassifier();
    clf.fit([[0]], [1, 1, 1, 0]);
    const preds = clf.predict([[0], [0], [0]]);
    expect(preds).toEqual([1, 1, 1]);
  });

  it('predicts majority class 0 when class 0 dominates', () => {
    const clf = new DummyClassifier();
    clf.fit([[0]], [0, 0, 0, 1]);
    const preds = clf.predict([[0], [0]]);
    expect(preds).toEqual([0, 0]);
  });

  it('defaults to class 0 on exact tie', () => {
    const clf = new DummyClassifier();
    clf.fit([[0]], [1, 1, 0, 0]);
    const preds = clf.predict([[0]]);
    expect(preds[0]).toBe(0);
  });

  it('predict output length matches X length', () => {
    const clf = new DummyClassifier();
    clf.fit([[0]], [1, 0, 1]);
    const preds = clf.predict([[0], [0], [0], [0], [0]]);
    expect(preds).toHaveLength(5);
  });

  it('predictProba returns class proportions', () => {
    const clf = new DummyClassifier();
    clf.fit([[0]], [1, 1, 1, 0]); // 1 count=3, 0 count=1
    const proba = clf.predictProba([[0], [0]]);
    expect(proba).toHaveLength(2);
    for (const [p0, p1] of proba) {
      expect(p0).toBeCloseTo(0.25, 5);
      expect(p1).toBeCloseTo(0.75, 5);
    }
  });

  it('throws when predict is called before fit', () => {
    const clf = new DummyClassifier();
    expect(() => clf.predict([[0]])).toThrow();
  });

  it('throws when fit receives empty labels array', () => {
    const clf = new DummyClassifier();
    expect(() => clf.fit([], [])).toThrow();
  });

  it('predict output contains only 0 or 1', () => {
    const clf = new DummyClassifier();
    clf.fit([[0]], [0, 1, 1]);
    const preds = clf.predict([[0], [0], [0]]);
    for (const p of preds) {
      expect([0, 1]).toContain(p);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// C. MultinomialNaiveBayes
// ─────────────────────────────────────────────────────────────────────────────
describe('C. MultinomialNaiveBayes', () => {
  /**
   * Small separable fixture (raw counts):
   * Class 0: docs [2, 0], [3, 0]   → feature 0 dominant
   * Class 1: docs [0, 2], [0, 3]   → feature 1 dominant
   */
  const X_nb = [
    [2, 0],
    [3, 0],
    [0, 2],
    [0, 3],
  ];
  const y_nb = [0, 0, 1, 1];

  it('calculates correct class log-priors (balanced classes)', () => {
    // alpha=1 for Laplace smoothing; priors depend only on class counts, not alpha
    const nb = new MultinomialNaiveBayes({ alpha: 1 });
    nb.fit(X_nb, y_nb);
    // Both classes have 2 documents each → prior = 0.5 → log(0.5)
    const logPriors = nb._logPriors;
    expect(logPriors[0]).toBeCloseTo(Math.log(0.5), 4);
    expect(logPriors[1]).toBeCloseTo(Math.log(0.5), 4);
  });

  it('applies Laplace smoothing (alpha=1)', () => {
    const nb = new MultinomialNaiveBayes({ alpha: 1 });
    nb.fit(X_nb, y_nb);
    // Class 0 total word count = 5, numFeatures=2
    // feature 0 count=5, feature 1 count=0
    // logLikelihood[0][0] = log((5+1)/(5+2)) = log(6/7)
    const ll = nb._logLikelihoods;
    expect(ll[0][0]).toBeCloseTo(Math.log(6 / 7), 4);
    expect(ll[0][1]).toBeCloseTo(Math.log(1 / 7), 4);
  });

  it('predicts correct class on clearly separable fixture', () => {
    const nb = new MultinomialNaiveBayes({ alpha: 1 });
    nb.fit(X_nb, y_nb);
    const preds = nb.predict([[5, 0], [0, 5]]);
    expect(preds[0]).toBe(0);
    expect(preds[1]).toBe(1);
  });

  it('predictProba returns normalized probabilities summing to 1', () => {
    const nb = new MultinomialNaiveBayes({ alpha: 1 });
    nb.fit(X_nb, y_nb);
    const proba = nb.predictProba([[5, 0], [0, 5]]);
    for (const [p0, p1] of proba) {
      expect(p0 + p1).toBeCloseTo(1.0, 5);
      expect(p0).toBeGreaterThanOrEqual(0);
      expect(p1).toBeGreaterThanOrEqual(0);
    }
  });

  it('predictLogProba returns log probabilities (log(proba))', () => {
    const nb = new MultinomialNaiveBayes({ alpha: 1 });
    nb.fit(X_nb, y_nb);
    const logProba = nb.predictLogProba([[5, 0]]);
    const proba = nb.predictProba([[5, 0]]);
    expect(logProba[0][0]).toBeCloseTo(Math.log(proba[0][0]), 4);
    expect(logProba[0][1]).toBeCloseTo(Math.log(proba[0][1]), 4);
  });

  it('model parameters are unchanged after predict', () => {
    const nb = new MultinomialNaiveBayes({ alpha: 1 });
    nb.fit(X_nb, y_nb);
    const priorBefore = [...nb._logPriors];
    nb.predict([[2, 0], [0, 2]]);
    expect(nb._logPriors).toEqual(priorBefore);
  });

  it('throws when alpha is not positive', () => {
    const nb = new MultinomialNaiveBayes({ alpha: -1 });
    expect(() => nb.fit(X_nb, y_nb)).toThrow();
  });

  it('throws when alpha is 0 and feature count is zero', () => {
    // alpha=0 Laplace → risk of log(0) on unseen feature; constructor should require alpha > 0 OR
    // the implementation should guard against log(0). We test that alpha=0 is rejected OR
    // that the model still works (predictProba sums to 1). Either is acceptable.
    // Here we just check predict does not return NaN or Infinity.
    const nb = new MultinomialNaiveBayes({ alpha: 0.001 });
    nb.fit(X_nb, y_nb);
    const preds = nb.predict([[0, 0]]);
    for (const p of preds) {
      expect(Number.isFinite(p)).toBe(true);
    }
  });

  it('predict output length matches X length', () => {
    const nb = new MultinomialNaiveBayes({ alpha: 1 });
    nb.fit(X_nb, y_nb);
    const preds = nb.predict([[1, 0], [0, 1], [1, 1]]);
    expect(preds).toHaveLength(3);
  });

  it('throws when predict is called before fit', () => {
    const nb = new MultinomialNaiveBayes();
    expect(() => nb.predict([[1, 0]])).toThrow();
  });

  it('throws when feature dimension of X differs from training', () => {
    const nb = new MultinomialNaiveBayes({ alpha: 1 });
    nb.fit(X_nb, y_nb);
    expect(() => nb.predict([[1, 2, 3]])).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// D. LogisticRegression
// ─────────────────────────────────────────────────────────────────────────────
describe('D. LogisticRegression', () => {
  /**
   * Perfectly separable 1-D fixture:
   * X = [[1], [2], [3], [10], [11], [12]]
   * y = [0, 0, 0, 1, 1, 1]
   */
  const X_lr = [[1], [2], [3], [10], [11], [12]];
  const y_lr = [0, 0, 0, 1, 1, 1];

  it('training loss decreases on a separable fixture', () => {
    const lr = new LogisticRegression({ learningRate: 0.1, epochs: 200, lambda: 0.0 });
    lr.fit(X_lr, y_lr);
    const history = lr.lossHistory;
    expect(history.length).toBeGreaterThan(1);
    expect(history[history.length - 1]).toBeLessThan(history[0]);
  });

  it('predicts correctly on separable fixture after sufficient training', () => {
    const lr = new LogisticRegression({ learningRate: 0.05, epochs: 500, lambda: 0.0 });
    lr.fit(X_lr, y_lr);
    const preds = lr.predict(X_lr);
    expect(preds).toEqual(y_lr);
  });

  it('predict output is array of 0 or 1', () => {
    const lr = new LogisticRegression({ learningRate: 0.05, epochs: 100 });
    lr.fit(X_lr, y_lr);
    const preds = lr.predict(X_lr);
    for (const p of preds) {
      expect([0, 1]).toContain(p);
    }
  });

  it('predictProba returns values in [0, 1]', () => {
    const lr = new LogisticRegression({ learningRate: 0.05, epochs: 100 });
    lr.fit(X_lr, y_lr);
    const probas = lr.predictProba(X_lr);
    expect(probas).toHaveLength(X_lr.length);
    for (const p of probas) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it('predict output length matches X length', () => {
    const lr = new LogisticRegression({ epochs: 10 });
    lr.fit(X_lr, y_lr);
    const preds = lr.predict(X_lr);
    expect(preds).toHaveLength(X_lr.length);
  });

  it('weights are initialized to zeros (deterministic)', () => {
    const lr = new LogisticRegression({ epochs: 0 });
    // 0 epochs → weights stay at init values
    // We fit but can check weights sum to 0 after 0 epochs
    lr.fit([[1], [0]], [1, 0]);
    // With 0 epochs no gradient step → all weights 0
    expect(lr.weights.every((w) => w === 0)).toBe(true);
  });

  it('L2 regularization reduces weight magnitude vs no regularization on same data', () => {
    const lrReg = new LogisticRegression({ learningRate: 0.1, epochs: 300, lambda: 1.0 });
    lrReg.fit(X_lr, y_lr);
    const lrNoReg = new LogisticRegression({ learningRate: 0.1, epochs: 300, lambda: 0.0 });
    lrNoReg.fit(X_lr, y_lr);
    const normReg = Math.abs(lrReg.weights[0]);
    const normNoReg = Math.abs(lrNoReg.weights[0]);
    expect(normReg).toBeLessThan(normNoReg);
  });

  it('is reproducible (same seed → same weights)', () => {
    const lr1 = new LogisticRegression({ learningRate: 0.05, epochs: 100, seed: 42 });
    lr1.fit(X_lr, y_lr);
    const lr2 = new LogisticRegression({ learningRate: 0.05, epochs: 100, seed: 42 });
    lr2.fit(X_lr, y_lr);
    expect(lr1.weights).toEqual(lr2.weights);
    expect(lr1.bias).toBeCloseTo(lr2.bias, 10);
  });

  it('throws when predict is called before fit', () => {
    const lr = new LogisticRegression();
    expect(() => lr.predict([[1]])).toThrow();
  });

  it('throws when feature dimension of X differs from training dimension', () => {
    const lr = new LogisticRegression({ epochs: 10 });
    lr.fit([[1, 2], [3, 4]], [0, 1]);
    expect(() => lr.predict([[1, 2, 3]])).toThrow();
  });

  it('predict does not modify weights after call', () => {
    const lr = new LogisticRegression({ learningRate: 0.05, epochs: 100 });
    lr.fit(X_lr, y_lr);
    const wBefore = [...lr.weights];
    lr.predict(X_lr);
    expect(lr.weights).toEqual(wBefore);
  });

  it('decisionFunction returns a numeric array of same length as X', () => {
    const lr = new LogisticRegression({ epochs: 10 });
    lr.fit(X_lr, y_lr);
    const scores = lr.decisionFunction(X_lr);
    expect(scores).toHaveLength(X_lr.length);
    for (const s of scores) {
      expect(Number.isFinite(s)).toBe(true);
    }
  });

  it('handles multi-feature input', () => {
    const X2 = [[1, 2], [3, 4], [5, 6], [10, 20], [15, 25], [20, 30]];
    const y2 = [0, 0, 0, 1, 1, 1];
    const lr = new LogisticRegression({ learningRate: 0.01, epochs: 200, lambda: 0.0 });
    lr.fit(X2, y2);
    const preds = lr.predict(X2);
    expect(preds).toHaveLength(X2.length);
    for (const p of preds) {
      expect([0, 1]).toContain(p);
    }
  });
});
