/**
 * metrics.js — Classification Evaluation Metrics (T10)
 *
 * Implements standard classification metrics for binary labels (0 = Not Disaster, 1 = Real Disaster):
 * - Accuracy
 * - Precision (positive class = 1)
 * - Recall (positive class = 1)
 * - F1 Score (positive class = 1)
 * - Confusion Matrix [[TN, FP], [FN, TP]]
 * - Comprehensive Classification Report with per-class, macro, and weighted averages.
 *
 * Zero-division handling:
 * When denominators are 0 (e.g. no positive predictions, or no true positives in data),
 * metric returns 0.0 rather than NaN, adhering to scikit-learn's zero_division=0 convention.
 */

/**
 * Validates ground truth and prediction arrays for binary classification.
 *
 * @param {Array} yTrue
 * @param {Array} yPred
 */
function validateBinaryInputs(yTrue, yPred) {
  if (!Array.isArray(yTrue) || !Array.isArray(yPred)) {
    throw new TypeError('yTrue and yPred must be arrays.');
  }
  if (yTrue.length === 0 || yPred.length === 0) {
    throw new RangeError('yTrue and yPred must not be empty.');
  }
  if (yTrue.length !== yPred.length) {
    throw new RangeError(
      `Length mismatch: yTrue length (${yTrue.length}) does not match yPred length (${yPred.length}).`
    );
  }

  for (let i = 0; i < yTrue.length; i++) {
    const yt = Number(yTrue[i]);
    const yp = Number(yPred[i]);
    if (yt !== 0 && yt !== 1) {
      throw new RangeError(`Invalid label in yTrue at index ${i}: ${yTrue[i]}. Expected 0 or 1.`);
    }
    if (yp !== 0 && yp !== 1) {
      throw new RangeError(`Invalid prediction in yPred at index ${i}: ${yPred[i]}. Expected 0 or 1.`);
    }
  }
}

/**
 * Computes confusion matrix counts: TP, FP, FN, TN.
 *
 * @param {Array<number>} yTrue
 * @param {Array<number>} yPred
 * @returns {{ tp: number, fp: number, fn: number, tn: number, total: number }}
 */
function getCounts(yTrue, yPred) {
  validateBinaryInputs(yTrue, yPred);
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;

  for (let i = 0; i < yTrue.length; i++) {
    const yt = Number(yTrue[i]);
    const yp = Number(yPred[i]);

    if (yt === 1 && yp === 1) tp++;
    else if (yt === 0 && yp === 1) fp++;
    else if (yt === 1 && yp === 0) fn++;
    else if (yt === 0 && yp === 0) tn++;
  }

  return { tp, fp, fn, tn, total: yTrue.length };
}

/**
 * Accuracy: (TP + TN) / Total
 *
 * @param {Array<number>} yTrue
 * @param {Array<number>} yPred
 * @returns {number}
 */
export function accuracyScore(yTrue, yPred) {
  const { tp, tn, total } = getCounts(yTrue, yPred);
  return total === 0 ? 0 : (tp + tn) / total;
}

/**
 * Precision for class 1: TP / (TP + FP)
 *
 * @param {Array<number>} yTrue
 * @param {Array<number>} yPred
 * @returns {number}
 */
export function precisionScore(yTrue, yPred) {
  const { tp, fp } = getCounts(yTrue, yPred);
  const denom = tp + fp;
  return denom === 0 ? 0 : tp / denom;
}

/**
 * Recall for class 1: TP / (TP + FN)
 *
 * @param {Array<number>} yTrue
 * @param {Array<number>} yPred
 * @returns {number}
 */
export function recallScore(yTrue, yPred) {
  const { tp, fn } = getCounts(yTrue, yPred);
  const denom = tp + fn;
  return denom === 0 ? 0 : tp / denom;
}

/**
 * F1 Score for class 1: 2 * (Precision * Recall) / (Precision + Recall)
 *
 * @param {Array<number>} yTrue
 * @param {Array<number>} yPred
 * @returns {number}
 */
export function f1Score(yTrue, yPred) {
  const p = precisionScore(yTrue, yPred);
  const r = recallScore(yTrue, yPred);
  const denom = p + r;
  return denom === 0 ? 0 : (2 * p * r) / denom;
}

/**
 * Confusion Matrix:
 * [
 *   [TN, FP], // Actual 0
 *   [FN, TP]  // Actual 1
 * ]
 *
 * @param {Array<number>} yTrue
 * @param {Array<number>} yPred
 * @returns {number[][]} 2x2 matrix
 */
export function confusionMatrix(yTrue, yPred) {
  const { tp, fp, fn, tn } = getCounts(yTrue, yPred);
  return [
    [tn, fp],
    [fn, tp],
  ];
}

/**
 * Detailed classification report containing:
 * - accuracy
 * - precision, recall, f1 (for class 1)
 * - confusionMatrix
 * - perClass metrics for class 0 and class 1 (precision, recall, f1, support)
 * - macroAvg (unweighted mean)
 * - weightedAvg (support-weighted mean)
 *
 * @param {Array<number>} yTrue
 * @param {Array<number>} yPred
 * @returns {Object}
 */
export function classificationReport(yTrue, yPred) {
  const { tp, fp, fn, tn, total } = getCounts(yTrue, yPred);

  // Class 1
  const p1 = tp + fp === 0 ? 0 : tp / (tp + fp);
  const r1 = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1_1 = p1 + r1 === 0 ? 0 : (2 * p1 * r1) / (p1 + r1);
  const support1 = tp + fn;

  // Class 0 (class 0 considered positive)
  const p0 = tn + fn === 0 ? 0 : tn / (tn + fn);
  const r0 = tn + fp === 0 ? 0 : tn / (tn + fp);
  const f1_0 = p0 + r0 === 0 ? 0 : (2 * p0 * r0) / (p0 + r0);
  const support0 = tn + fp;

  const accuracy = total === 0 ? 0 : (tp + tn) / total;

  // Macro average
  const macroPrecision = (p0 + p1) / 2;
  const macroRecall = (r0 + r1) / 2;
  const macroF1 = (f1_0 + f1_1) / 2;

  // Weighted average
  const weightedPrecision = total === 0 ? 0 : (p0 * support0 + p1 * support1) / total;
  const weightedRecall = total === 0 ? 0 : (r0 * support0 + r1 * support1) / total;
  const weightedF1 = total === 0 ? 0 : (f1_0 * support0 + f1_1 * support1) / total;

  return {
    accuracy,
    precision: p1,
    recall: r1,
    f1: f1_1,
    confusionMatrix: [
      [tn, fp],
      [fn, tp],
    ],
    perClass: {
      '0': {
        precision: p0,
        recall: r0,
        f1: f1_0,
        support: support0,
      },
      '1': {
        precision: p1,
        recall: r1,
        f1: f1_1,
        support: support1,
      },
    },
    macroAvg: {
      precision: macroPrecision,
      recall: macroRecall,
      f1: macroF1,
    },
    weightedAvg: {
      precision: weightedPrecision,
      recall: weightedRecall,
      f1: weightedF1,
    },
  };
}
