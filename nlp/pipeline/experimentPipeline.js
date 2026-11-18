/**
 * experimentPipeline.js — End-to-End Leakage-Safe NLP Pipeline (T10)
 *
 * Implements the full NLP lifecycle:
 * 1. Data ingestion (real CSV file or in-memory records)
 * 2. Deterministic 70/15/15 stratified splitting (seed=42)
 * 3. Fitting TF-IDF Vectorizer ONLY on training partition
 * 4. Fitting Chi-Square Feature Selector ONLY on training features
 * 5. Transforming validation and test partitions with frozen parameters
 * 6. Training candidate models (Baseline, Naive Bayes, Logistic Regression) on training partition
 * 7. Comparing and selecting best model using VALIDATION set metrics only
 * 8. Final evaluation on TEST partition executed strictly after model selection is finalized
 */

import fs from 'fs';
import path from 'path';
import { loadAndAnalyzeDataset } from '../ingestion/datasetLoader.js';
import { splitDataset } from '../features/dataSplitter.js';
import { TfidfVectorizer } from '../features/tfidfVectorizer.js';
import { ChiSquareSelector } from '../features/featureSelector.js';
import { ModelComparison } from '../evaluation/modelComparison.js';
import { ModelEvaluator } from '../evaluation/modelEvaluator.js';

export class ExperimentPipeline {
  constructor(options = {}) {
    this.seed = options.seed ?? 42;
    this.trainRatio = options.trainRatio ?? 0.7;
    this.validationRatio = options.validationRatio ?? 0.15;
    this.testRatio = options.testRatio ?? 0.15;
    this.kFeatures = options.kFeatures ?? 50;
    this.vectorizerOptions = options.vectorizerOptions || {
      ngramRange: [1, 2],
      minDf: 1,
      sublinearTf: true,
      norm: 'l2',
    };
  }

  /**
   * Executes the end-to-end experiment pipeline.
   *
   * @param {Object} [input]
   * @param {Array<Object>} [input.records] - In-memory array of tweet objects.
   * @param {string} [input.filePath] - Path to raw train.csv.
   * @returns {Promise<Object>} Results of pipeline or datasetMissing flag.
   */
  async run(input = {}) {
    let records = input.records;

    if (!records) {
      const targetPath = path.resolve(input.filePath || 'data/raw/train.csv');
      if (!fs.existsSync(targetPath)) {
        return {
          datasetMissing: true,
          message: `Dataset file not found at ${targetPath}. Please provide the real Kaggle Disaster Tweets CSV.`,
        };
      }

      try {
        const datasetData = await loadAndAnalyzeDataset(targetPath);
        records = datasetData.records;
      } catch (err) {
        if (err.code === 'DATASET_MISSING' || err.statusCode === 503) {
          return {
            datasetMissing: true,
            message: err.message,
          };
        }
        throw err;
      }
    }

    if (!Array.isArray(records) || records.length === 0) {
      return {
        datasetMissing: true,
        message: 'No records available for pipeline execution.',
      };
    }

    // Step 1: Stratified Splitting (70% Train, 15% Val, 15% Test)
    const splits = splitDataset(records, {
      trainRatio: this.trainRatio,
      validationRatio: this.validationRatio,
      testRatio: this.testRatio,
      seed: this.seed,
      stratifyBy: 'target',
    });

    const trainDocs = splits.train.map((r) => r.text || '');
    const y_train = splits.train.map((r) => Number(r.target));

    const valDocs = splits.validation.map((r) => r.text || '');
    const y_val = splits.validation.map((r) => Number(r.target));

    const testDocs = splits.test.map((r) => r.text || '');
    const y_test = splits.test.map((r) => Number(r.target));

    // Step 2: Fit TF-IDF Vectorizer ONLY on training partition
    const vectorizer = new TfidfVectorizer(this.vectorizerOptions);
    const X_train_raw = vectorizer.fitTransform(trainDocs);

    // Transform val and test with FROZEN parameters
    const X_val_raw = vectorizer.transform(valDocs);
    const X_test_raw = vectorizer.transform(testDocs);

    const vocabSize = vectorizer.getFeatureNames().length;

    // Step 3: Feature Selection (Chi-Square) fitted ONLY on training partition
    const actualK = Math.min(this.kFeatures, vocabSize);
    let X_train = X_train_raw;
    let X_val = X_val_raw;
    let X_test = X_test_raw;
    let selector = null;

    if (actualK > 0 && actualK < vocabSize) {
      selector = new ChiSquareSelector({ k: actualK });
      X_train = selector.fitTransform(X_train_raw, y_train);
      X_val = selector.transform(X_val_raw);
      X_test = selector.transform(X_test_raw);
    }

    // Step 4: Model Training on Train & Comparison on Validation
    const comparison = new ModelComparison();
    const comparisonResults = await comparison.compare(X_train, y_train, X_val, y_val);

    // Step 5: Select Best Model based on Validation F1
    const bestModelResult = comparison.getBestModel(comparisonResults, 'f1');

    // Step 6: Evaluate Selected Best Model on Test Partition (Strictly Deferred)
    const evaluator = new ModelEvaluator();
    const testEvaluation = evaluator.evaluate(bestModelResult.model, X_test, y_test);

    return {
      datasetMissing: false,
      leakagePrevented: true,
      splits: {
        trainSize: splits.train.length,
        validationSize: splits.validation.length,
        testSize: splits.test.length,
      },
      vectorizerInfo: {
        nTrainingDocs: vectorizer.nTrainingDocs,
        vocabularySize: vocabSize,
        featureNames: vectorizer.getFeatureNames(),
      },
      featureSelectorInfo: {
        nFeaturesSelected: selector ? actualK : vocabSize,
        scores: selector ? selector.getScores() : null,
      },
      comparisonResults: comparisonResults.map((r) => ({
        modelName: r.modelName,
        isBaseline: r.isBaseline,
        accuracy: r.accuracy,
        precision: r.precision,
        recall: r.recall,
        f1: r.f1,
        confusionMatrix: r.confusionMatrix,
      })),
      bestModel: {
        modelName: bestModelResult.modelName,
        isBaseline: bestModelResult.isBaseline,
        validationF1: bestModelResult.f1,
        validationAccuracy: bestModelResult.accuracy,
      },
      testEvaluation,
      artifacts: {
        vectorizer,
        selector,
        model: bestModelResult.model,
        comparisonResults,
      },
    };
  }
}
