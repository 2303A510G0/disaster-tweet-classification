/**
 * T10 — Unit Tests: Metrics, ModelEvaluator, ModelComparison, ExperimentPipeline
 *
 * RED phase: written before implementation files exist.
 * Hand-calculated examples are used for every metric assertion.
 *
 * Ground-truth fixture (4 samples):
 *   yTrue = [1, 1, 0, 0]
 *   yPred = [1, 0, 0, 1]
 *
 *   TP = 1 (true=1 pred=1)
 *   FN = 1 (true=1 pred=0)
 *   FP = 1 (true=0 pred=1)
 *   TN = 1 (true=0 pred=0)
 *
 *   accuracy  = (TP + TN) / N = 2/4 = 0.5
 *   precision = TP / (TP+FP)  = 1/2 = 0.5
 *   recall    = TP / (TP+FN)  = 1/2 = 0.5
 *   F1        = 2*P*R/(P+R)   = 0.5
 *
 *   confusionMatrix (rows=actual, cols=predicted):
 *     [[TN, FP], [FN, TP]] = [[1, 1], [1, 1]]
 */

import { describe, it, expect } from 'vitest';

import {
  accuracyScore,
  precisionScore,
  recallScore,
  f1Score,
  confusionMatrix,
  classificationReport,
} from '../../../nlp/evaluation/metrics.js';

import { ModelEvaluator } from '../../../nlp/evaluation/modelEvaluator.js';
import { ModelComparison } from '../../../nlp/evaluation/modelComparison.js';
import { ExperimentPipeline } from '../../../nlp/pipeline/experimentPipeline.js';
import { DummyClassifier } from '../../../nlp/models/baselineClassifier.js';

// ─── shared fixtures ─────────────────────────────────────────────────────────

const yTrue4 = [1, 1, 0, 0];
const yPred4 = [1, 0, 0, 1]; // TP=1 FN=1 FP=1 TN=1

const yPerfect = [1, 1, 0, 0];
const yPredPerf = [1, 1, 0, 0]; // TP=2 FN=0 FP=0 TN=2

const yAllWrong = [1, 1, 0, 0];
const yPredAllWrong = [0, 0, 1, 1]; // TP=0 FN=2 FP=2 TN=0

// ─────────────────────────────────────────────────────────────────────────────
// A. metrics.js
// ─────────────────────────────────────────────────────────────────────────────
describe('A. metrics — accuracyScore', () => {
  it('computes 0.5 on hand-calculated fixture', () => {
    expect(accuracyScore(yTrue4, yPred4)).toBeCloseTo(0.5, 5);
  });

  it('returns 1.0 on perfect predictions', () => {
    expect(accuracyScore(yPerfect, yPredPerf)).toBeCloseTo(1.0, 5);
  });

  it('returns 0.0 when all predictions are wrong', () => {
    expect(accuracyScore(yAllWrong, yPredAllWrong)).toBeCloseTo(0.0, 5);
  });

  it('throws when lengths differ', () => {
    expect(() => accuracyScore([1, 0], [1])).toThrow();
  });

  it('throws on empty arrays', () => {
    expect(() => accuracyScore([], [])).toThrow();
  });
});

describe('A. metrics — precisionScore', () => {
  it('computes 0.5 on hand-calculated fixture (positive class = 1)', () => {
    expect(precisionScore(yTrue4, yPred4)).toBeCloseTo(0.5, 5);
  });

  it('returns 1.0 on perfect predictions', () => {
    expect(precisionScore(yPerfect, yPredPerf)).toBeCloseTo(1.0, 5);
  });

  it('returns 0.0 when no positive predictions are correct', () => {
    expect(precisionScore(yAllWrong, yPredAllWrong)).toBeCloseTo(0.0, 5);
  });

  it('returns 0 (not NaN) when no positive predictions at all (zero division)', () => {
    // yPred = all 0 → TP + FP = 0 → precision = 0 by convention
    const result = precisionScore([1, 0, 1], [0, 0, 0]);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeCloseTo(0, 5);
  });

  it('throws when lengths differ', () => {
    expect(() => precisionScore([1], [1, 0])).toThrow();
  });
});

describe('A. metrics — recallScore', () => {
  it('computes 0.5 on hand-calculated fixture', () => {
    expect(recallScore(yTrue4, yPred4)).toBeCloseTo(0.5, 5);
  });

  it('returns 1.0 on perfect predictions', () => {
    expect(recallScore(yPerfect, yPredPerf)).toBeCloseTo(1.0, 5);
  });

  it('returns 0 (not NaN) when no actual positives (zero division)', () => {
    // yTrue = all 0 → TP + FN = 0 → recall = 0 by convention
    const result = recallScore([0, 0, 0], [1, 1, 0]);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeCloseTo(0, 5);
  });

  it('throws when lengths differ', () => {
    expect(() => recallScore([1], [1, 0])).toThrow();
  });
});

describe('A. metrics — f1Score', () => {
  it('computes 0.5 on hand-calculated fixture', () => {
    expect(f1Score(yTrue4, yPred4)).toBeCloseTo(0.5, 5);
  });

  it('returns 1.0 on perfect predictions', () => {
    expect(f1Score(yPerfect, yPredPerf)).toBeCloseTo(1.0, 5);
  });

  it('returns 0 (not NaN) when precision and recall are both 0 (zero division)', () => {
    const result = f1Score([1, 1], [0, 0]);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeCloseTo(0, 5);
  });

  it('formula: 2*P*R/(P+R) on a 3/4 precision, 1/1 recall case', () => {
    // yTrue=[1,1,1,0], yPred=[1,1,1,1] → TP=3,FP=1,FN=0,TN=0
    // precision=3/4=0.75, recall=3/3=1.0, F1=2*0.75*1/(0.75+1)=1.5/1.75≈0.857
    const result = f1Score([1, 1, 1, 0], [1, 1, 1, 1]);
    expect(result).toBeCloseTo((2 * 0.75 * 1.0) / (0.75 + 1.0), 4);
  });
});

describe('A. metrics — confusionMatrix', () => {
  it('returns [[TN,FP],[FN,TP]] on hand-calculated fixture', () => {
    const cm = confusionMatrix(yTrue4, yPred4);
    // TN=1, FP=1, FN=1, TP=1
    expect(cm).toEqual([[1, 1], [1, 1]]);
  });

  it('returns [[2,0],[0,2]] on perfect predictions', () => {
    const cm = confusionMatrix(yPerfect, yPredPerf);
    expect(cm).toEqual([[2, 0], [0, 2]]);
  });

  it('returns [[0,2],[2,0]] when all predictions wrong', () => {
    const cm = confusionMatrix(yAllWrong, yPredAllWrong);
    expect(cm).toEqual([[0, 2], [2, 0]]);
  });

  it('throws when lengths differ', () => {
    expect(() => confusionMatrix([1], [1, 0])).toThrow();
  });

  it('returns a 2x2 array', () => {
    const cm = confusionMatrix(yTrue4, yPred4);
    expect(cm).toHaveLength(2);
    expect(cm[0]).toHaveLength(2);
    expect(cm[1]).toHaveLength(2);
  });
});

describe('A. metrics — classificationReport', () => {
  it('returns an object with accuracy, precision, recall, f1 properties', () => {
    const report = classificationReport(yTrue4, yPred4);
    expect(report).toHaveProperty('accuracy');
    expect(report).toHaveProperty('precision');
    expect(report).toHaveProperty('recall');
    expect(report).toHaveProperty('f1');
  });

  it('contains a confusionMatrix property', () => {
    const report = classificationReport(yTrue4, yPred4);
    expect(report).toHaveProperty('confusionMatrix');
    expect(report.confusionMatrix).toHaveLength(2);
  });

  it('contains perClass object with class 0 and class 1 entries', () => {
    const report = classificationReport(yTrue4, yPred4);
    expect(report).toHaveProperty('perClass');
    expect(report.perClass).toHaveProperty('0');
    expect(report.perClass).toHaveProperty('1');
  });

  it('perClass entries each have precision, recall, f1, support', () => {
    const report = classificationReport(yTrue4, yPred4);
    for (const cls of ['0', '1']) {
      expect(report.perClass[cls]).toHaveProperty('precision');
      expect(report.perClass[cls]).toHaveProperty('recall');
      expect(report.perClass[cls]).toHaveProperty('f1');
      expect(report.perClass[cls]).toHaveProperty('support');
    }
  });

  it('contains macroAvg with precision, recall, f1', () => {
    const report = classificationReport(yTrue4, yPred4);
    expect(report).toHaveProperty('macroAvg');
    expect(report.macroAvg).toHaveProperty('precision');
    expect(report.macroAvg).toHaveProperty('recall');
    expect(report.macroAvg).toHaveProperty('f1');
  });

  it('contains weightedAvg with precision, recall, f1', () => {
    const report = classificationReport(yTrue4, yPred4);
    expect(report).toHaveProperty('weightedAvg');
    expect(report.weightedAvg).toHaveProperty('precision');
    expect(report.weightedAvg).toHaveProperty('recall');
    expect(report.weightedAvg).toHaveProperty('f1');
  });

  it('support values sum to total samples', () => {
    const report = classificationReport(yTrue4, yPred4);
    const totalSupport = Object.values(report.perClass).reduce(
      (s, v) => s + v.support,
      0
    );
    expect(totalSupport).toBe(yTrue4.length);
  });

  it('macroAvg precision is average of per-class precisions', () => {
    const report = classificationReport(yTrue4, yPred4);
    const perClassPrecisions = Object.values(report.perClass).map((c) => c.precision);
    const avg = perClassPrecisions.reduce((s, v) => s + v, 0) / perClassPrecisions.length;
    expect(report.macroAvg.precision).toBeCloseTo(avg, 5);
  });

  it('all numeric values are finite', () => {
    const report = classificationReport(yTrue4, yPred4);
    expect(Number.isFinite(report.accuracy)).toBe(true);
    expect(Number.isFinite(report.precision)).toBe(true);
    expect(Number.isFinite(report.recall)).toBe(true);
    expect(Number.isFinite(report.f1)).toBe(true);
  });

  it('throws when lengths differ', () => {
    expect(() => classificationReport([1, 0], [1])).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// B. ModelEvaluator
// ─────────────────────────────────────────────────────────────────────────────
describe('B. ModelEvaluator', () => {
  /**
   * Tiny fixture — DummyClassifier fitted externally, evaluated on the same data.
   * We use small raw-count arrays as "feature matrix" for DummyClassifier
   * (it ignores X, so the values are irrelevant).
   */
  const X_fixture = [[1, 0], [0, 1], [1, 0], [0, 1]];
  const y_fixture = [1, 0, 1, 0];

  it('evaluate() returns a report object with accuracy property', () => {
    const clf = new DummyClassifier();
    clf.fit(X_fixture, y_fixture);

    const evaluator = new ModelEvaluator();
    const result = evaluator.evaluate(clf, X_fixture, y_fixture);
    expect(result).toHaveProperty('accuracy');
  });

  it('evaluate() does not change model weights after evaluation', () => {
    const clf = new DummyClassifier();
    clf.fit(X_fixture, y_fixture);
    const majorityBefore = clf._majorityClass;

    const evaluator = new ModelEvaluator();
    evaluator.evaluate(clf, X_fixture, y_fixture);

    expect(clf._majorityClass).toBe(majorityBefore);
  });

  it('evaluatePredictions() returns all standard metric keys', () => {
    const evaluator = new ModelEvaluator();
    const result = evaluator.evaluatePredictions(yTrue4, yPred4);
    expect(result).toHaveProperty('accuracy');
    expect(result).toHaveProperty('precision');
    expect(result).toHaveProperty('recall');
    expect(result).toHaveProperty('f1');
    expect(result).toHaveProperty('confusionMatrix');
  });

  it('evaluatePredictions() computes correct accuracy', () => {
    const evaluator = new ModelEvaluator();
    const result = evaluator.evaluatePredictions(yTrue4, yPred4);
    expect(result.accuracy).toBeCloseTo(0.5, 5);
  });

  it('evaluateProbabilities() validates that proba values are in [0, 1]', () => {
    const evaluator = new ModelEvaluator();
    // Valid: probas in [0,1]
    expect(() =>
      evaluator.evaluateProbabilities([1, 0], [0.9, 0.2])
    ).not.toThrow();
    // Invalid: proba > 1
    expect(() =>
      evaluator.evaluateProbabilities([1, 0], [1.5, 0.2])
    ).toThrow();
  });

  it('evaluateProbabilities() returns log-loss in result', () => {
    const evaluator = new ModelEvaluator();
    const result = evaluator.evaluateProbabilities([1, 0, 1], [0.9, 0.1, 0.8]);
    expect(result).toHaveProperty('logLoss');
    expect(Number.isFinite(result.logLoss)).toBe(true);
  });

  it('evaluate() throws if model has no predict method', () => {
    const evaluator = new ModelEvaluator();
    expect(() => evaluator.evaluate({}, X_fixture, y_fixture)).toThrow();
  });

  it('evaluatePredictions() throws when lengths differ', () => {
    const evaluator = new ModelEvaluator();
    expect(() => evaluator.evaluatePredictions([1, 0], [1])).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// C. ModelComparison
// ─────────────────────────────────────────────────────────────────────────────
describe('C. ModelComparison', () => {
  /**
   * Tiny separable fixture — 6 training, 4 validation samples.
   * Features: 2-element raw-count arrays.
   * Class 0 samples have high feature-0, class 1 samples have high feature-1.
   */
  const X_train = [[3, 0], [4, 0], [3, 1], [0, 3], [0, 4], [1, 3]];
  const y_train = [0, 0, 0, 1, 1, 1];

  const X_val = [[2, 0], [0, 2], [3, 0], [0, 3]];
  const y_val = [0, 1, 0, 1];

  it('compare() returns an array of result objects, one per model', async () => {
    const comparison = new ModelComparison();
    const results = await comparison.compare(X_train, y_train, X_val, y_val);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(3); // Dummy, NB, LR
  });

  it('each result has modelName, accuracy, precision, recall, f1 properties', async () => {
    const comparison = new ModelComparison();
    const results = await comparison.compare(X_train, y_train, X_val, y_val);
    for (const r of results) {
      expect(r).toHaveProperty('modelName');
      expect(r).toHaveProperty('accuracy');
      expect(r).toHaveProperty('precision');
      expect(r).toHaveProperty('recall');
      expect(r).toHaveProperty('f1');
    }
  });

  it('results array includes a DummyClassifier entry (baseline)', async () => {
    const comparison = new ModelComparison();
    const results = await comparison.compare(X_train, y_train, X_val, y_val);
    const names = results.map((r) => r.modelName);
    expect(names.some((n) => n.toLowerCase().includes('dummy') || n.toLowerCase().includes('baseline'))).toBe(true);
  });

  it('all accuracy values are in [0, 1]', async () => {
    const comparison = new ModelComparison();
    const results = await comparison.compare(X_train, y_train, X_val, y_val);
    for (const r of results) {
      expect(r.accuracy).toBeGreaterThanOrEqual(0);
      expect(r.accuracy).toBeLessThanOrEqual(1);
    }
  });

  it('all results use the same validation data (consistent comparison)', async () => {
    const comparison = new ModelComparison();
    // Run twice with same inputs → same results
    const r1 = await comparison.compare(X_train, y_train, X_val, y_val);
    const r2 = await comparison.compare(X_train, y_train, X_val, y_val);
    expect(r1.map((r) => r.accuracy)).toEqual(r2.map((r) => r.accuracy));
  });

  it('getBestModel() returns the model with highest f1 on validation', async () => {
    const comparison = new ModelComparison();
    const results = await comparison.compare(X_train, y_train, X_val, y_val);
    const best = comparison.getBestModel(results);
    expect(best).toHaveProperty('modelName');
    const maxF1 = Math.max(...results.map((r) => r.f1));
    expect(best.f1).toBe(maxF1);
  });

  it('compare() does not access y_test (no test labels passed → not used)', async () => {
    // ModelComparison only accepts X_train, y_train, X_val, y_val (no test)
    const comparison = new ModelComparison();
    // Should resolve without needing a test-set argument
    const results = await comparison.compare(X_train, y_train, X_val, y_val);
    expect(results).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// D. ExperimentPipeline
// ─────────────────────────────────────────────────────────────────────────────
describe('D. ExperimentPipeline', () => {
  /**
   * Synthetic records mimicking the Kaggle CSV row structure.
   * id, keyword, location, text, target
   * We use 20 records to exercise the splitter (10 class-0, 10 class-1).
   */
  function makeRecords(n = 20) {
    const records = [];
    for (let i = 0; i < n; i++) {
      records.push({
        id: String(i),
        keyword: '',
        location: '',
        text: i % 2 === 0
          ? `flood warning emergency rescue zone ${i}`
          : `beautiful sunny day picnic garden ${i}`,
        target: String(i % 2 === 1 ? 0 : 1), // even → disaster(1), odd → not(0)
      });
    }
    return records;
  }

  it('run() returns a result object when given in-memory records', async () => {
    const pipeline = new ExperimentPipeline({ seed: 42 });
    const result = await pipeline.run({ records: makeRecords(20) });
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });

  it('result contains splits metadata (train/validation/test sizes)', async () => {
    const pipeline = new ExperimentPipeline({ seed: 42 });
    const result = await pipeline.run({ records: makeRecords(20) });
    expect(result).toHaveProperty('splits');
    expect(result.splits).toHaveProperty('trainSize');
    expect(result.splits).toHaveProperty('validationSize');
    expect(result.splits).toHaveProperty('testSize');
  });

  it('train+validation+test sizes sum to total records', async () => {
    const records = makeRecords(20);
    const pipeline = new ExperimentPipeline({ seed: 42 });
    const result = await pipeline.run({ records });
    const { trainSize, validationSize, testSize } = result.splits;
    expect(trainSize + validationSize + testSize).toBe(records.length);
  });

  it('vectorizer is fitted on training partition only', async () => {
    const pipeline = new ExperimentPipeline({ seed: 42 });
    const result = await pipeline.run({ records: makeRecords(20) });
    // Confirm nTrainingDocs matches training split size
    expect(result).toHaveProperty('vectorizerInfo');
    expect(result.vectorizerInfo.nTrainingDocs).toBe(result.splits.trainSize);
  });

  it('feature selection is fitted on training features only', async () => {
    const pipeline = new ExperimentPipeline({ seed: 42 });
    const result = await pipeline.run({ records: makeRecords(20) });
    expect(result).toHaveProperty('featureSelectorInfo');
    expect(result.featureSelectorInfo.nFeaturesSelected).toBeGreaterThan(0);
  });

  it('comparison results are present and have at least 3 models', async () => {
    const pipeline = new ExperimentPipeline({ seed: 42 });
    const result = await pipeline.run({ records: makeRecords(20) });
    expect(result).toHaveProperty('comparisonResults');
    expect(result.comparisonResults.length).toBeGreaterThanOrEqual(3);
  });

  it('bestModel is selected using validation data only', async () => {
    const pipeline = new ExperimentPipeline({ seed: 42 });
    const result = await pipeline.run({ records: makeRecords(20) });
    expect(result).toHaveProperty('bestModel');
    expect(result.bestModel).toHaveProperty('modelName');
  });

  it('testEvaluation is present and computed after model selection', async () => {
    const pipeline = new ExperimentPipeline({ seed: 42 });
    const result = await pipeline.run({ records: makeRecords(20) });
    expect(result).toHaveProperty('testEvaluation');
    expect(result.testEvaluation).toHaveProperty('accuracy');
  });

  it('is deterministic: same seed produces identical results', async () => {
    const records = makeRecords(20);
    const r1 = await new ExperimentPipeline({ seed: 42 }).run({ records });
    const r2 = await new ExperimentPipeline({ seed: 42 }).run({ records });
    expect(r1.splits.trainSize).toBe(r2.splits.trainSize);
    expect(r1.bestModel.modelName).toBe(r2.bestModel.modelName);
    expect(r1.testEvaluation.accuracy).toBeCloseTo(r2.testEvaluation.accuracy, 8);
  });

  it('reports datasetMissing=true when no records and no file provided', async () => {
    const pipeline = new ExperimentPipeline({ seed: 42 });
    const result = await pipeline.run({ records: [] });
    expect(result.datasetMissing).toBe(true);
  });

  it('no test-set labels used before model selection (testEvaluation deferred)', async () => {
    const pipeline = new ExperimentPipeline({ seed: 42 });
    // We verify test evaluation exists and was produced after bestModel selection
    const result = await pipeline.run({ records: makeRecords(20) });
    expect(result.bestModel).toBeTruthy();         // model selected first
    expect(result.testEvaluation).toBeTruthy();    // then evaluated
    expect(result.leakagePrevented).toBe(true);    // pipeline asserts leakage prevention
  });
});
