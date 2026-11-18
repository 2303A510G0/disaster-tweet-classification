/**
 * featuresService.js — Feature Extraction & Selection Service (T15)
 *
 * Provides Bag of Words, TF-IDF calculation, and Chi-Square feature selection
 * demonstration using the pure JavaScript NLP modules.
 */

import fs from 'fs';
import path from 'path';
import { CountVectorizer } from '../../../nlp/features/countVectorizer.js';
import { TfidfVectorizer } from '../../../nlp/features/tfidfVectorizer.js';
import { ChiSquareSelector } from '../../../nlp/features/featureSelector.js';
import { modelService } from './modelService.js';

const DEFAULT_EDUCATIONAL_CORPUS = [
  'forest fire evacuation alert in northern county',
  'earthquake damage reported after severe tremors',
  'great party tonight having fun with friends',
  'severe weather warning issued for coastal areas',
];

/**
 * Validates text input for feature extraction.
 *
 * @param {string} text - Raw input tweet text.
 * @returns {string} Trimmed text.
 */
function validateTextInput(text) {
  if (text === undefined || text === null || typeof text !== 'string') {
    const error = new Error("Field 'text' is required and must be a string.");
    error.statusCode = 422;
    throw error;
  }

  const trimmed = text.trim();
  if (trimmed === '') {
    const error = new Error("Field 'text' is required and must not be empty.");
    error.statusCode = 422;
    throw error;
  }

  if (trimmed.length > 2000) {
    const error = new Error("Field 'text' exceeds maximum length of 2000 characters.");
    error.statusCode = 422;
    throw error;
  }

  return trimmed;
}

/**
 * Extracts Bag of Words (BoW) and TF-IDF features for an input text.
 *
 * @param {Object} params
 * @param {string} params.text - Input tweet text.
 * @param {string[]} [params.corpus] - Custom reference corpus.
 * @param {number[]} [params.ngramRange] - [minN, maxN] n-gram range.
 * @param {boolean} [params.sublinearTf] - Whether to use sublinear TF scaling.
 * @param {number} [params.minDf] - Minimum document frequency.
 * @returns {Object} Structured feature representations.
 */
export function extractFeatures(params = {}) {
  const text = validateTextInput(params.text);
  const ngramRange = Array.isArray(params.ngramRange) && params.ngramRange.length === 2
    ? params.ngramRange
    : [1, 1];
  const sublinearTf = params.sublinearTf === true;
  const minDf = typeof params.minDf === 'number' && params.minDf >= 1 ? params.minDf : 1;

  const corpus = Array.isArray(params.corpus) && params.corpus.length > 0
    ? params.corpus.filter((doc) => typeof doc === 'string' && doc.trim().length > 0)
    : DEFAULT_EDUCATIONAL_CORPUS;

  const allDocuments = [...corpus, text];

  // 1. Bag of Words (CountVectorizer)
  const countVec = new CountVectorizer({
    ngramRange,
    minDf,
  });
  countVec.fit(allDocuments);

  const bowMatrix = countVec.transform([text]);
  const denseBowVector = bowMatrix[0] || [];
  const featureNames = countVec.getFeatureNames();

  const vocabulary = featureNames.map((term) => ({
    term,
    index: countVec.vocabulary.get(term),
  }));

  const tokenCounts = featureNames.map((term, idx) => ({
    term,
    index: idx,
    count: denseBowVector[idx] || 0,
  }));

  // Non-zero tokens for concise display
  const activeTokens = tokenCounts.filter((item) => item.count > 0);

  // 2. TF-IDF Vectorizer
  const tfidfVec = new TfidfVectorizer({
    ngramRange,
    sublinearTf,
    minDf,
    smoothIdf: true,
    norm: 'l2',
  });
  tfidfVec.fit(allDocuments);

  const tfidfMatrix = tfidfVec.transform([text]);
  const denseTfidfVector = tfidfMatrix[0] || [];

  const terms = featureNames.map((term, idx) => {
    const tf = denseBowVector[idx] || 0;
    const df = tfidfVec.documentFrequencies[idx] || 0;
    const idf = Number((tfidfVec.idfWeights[idx] || 0).toFixed(4));
    const tfidfVal = Number((denseTfidfVector[idx] || 0).toFixed(4));

    return {
      term,
      index: idx,
      tf,
      df,
      idf,
      tfidf: tfidfVal,
    };
  });

  const activeTerms = terms.filter((item) => item.tf > 0);

  return {
    text,
    ngramRange,
    referenceCorpusSize: allDocuments.length,
    bow: {
      vocabulary,
      featureNames,
      tokenCounts,
      activeTokens,
      denseVector: denseBowVector,
      totalFeatures: featureNames.length,
    },
    tfidf: {
      terms,
      activeTerms,
      denseVector: denseTfidfVector.map((val) => Number(val.toFixed(4))),
      norm: 'l2',
      smoothIdf: true,
      sublinearTf,
      formulas: {
        smoothIdf: 'ln((1 + N) / (1 + DF)) + 1',
        sublinearTf: sublinearTf ? '1 + ln(count)' : 'count',
        tfidf: 'TF * IDF',
        l2Norm: 'v / sqrt(sum(v_i^2))',
      },
    },
  };
}

/**
 * Returns dataset-wide feature information if a model has been trained and loaded.
 *
 * @param {Object} [customModelService] - Injected service for testing.
 * @returns {Object}
 */
export function getDatasetFeaturesInfo(customModelService = modelService) {
  const status = customModelService.getStatus();
  const activeVectorizer = customModelService.activeVectorizer;
  const activeSelector = customModelService.activeSelector;

  if (activeVectorizer && status.modelLoaded) {
    const featureNames = activeVectorizer.getFeatureNames();
    const vocabularySize = activeVectorizer.vocabulary ? activeVectorizer.vocabulary.size : 0;

    let selectedFeatures = [];
    if (activeSelector && activeSelector.getSelectedIndices) {
      const selectedIndices = activeSelector.getSelectedIndices();
      const scores = activeSelector.getScores();

      selectedFeatures = selectedIndices.map((idx) => ({
        index: idx,
        term: featureNames[idx] || `feature_${idx}`,
        score: scores ? Number((scores[idx] || 0).toFixed(4)) : null,
      }));
    }

    return {
      isTrained: true,
      datasetAvailable: status.datasetAvailable,
      modelLoaded: true,
      selectedModel: status.selectedModel,
      vocabularySize,
      ngramRange: activeVectorizer.ngramRange || [1, 1],
      selectedFeaturesCount: selectedFeatures.length,
      sampleSelectedFeatures: selectedFeatures.slice(0, 50),
    };
  }

  return {
    isTrained: false,
    datasetAvailable: status.datasetAvailable,
    modelLoaded: false,
    selectedModel: null,
    message: 'Dataset features not loaded. Train a model or place train.csv to inspect dataset-derived vocabulary.',
  };
}

/**
 * Generates an educational interactive demonstration showing how BoW, TF-IDF,
 * and 2x2 Chi-Square contingency tables are computed step-by-step.
 *
 * @returns {Object}
 */
export function getEducationalDemo() {
  const documents = [
    { text: 'forest fire evacuation alert in city', label: 1, labelName: 'Disaster (1)' },
    { text: 'earthquake damage severe emergency rescue', label: 1, labelName: 'Disaster (1)' },
    { text: 'great party tonight having fun with friends', label: 0, labelName: 'Non-Disaster (0)' },
    { text: 'sunny day beach vacation beautiful weather', label: 0, labelName: 'Non-Disaster (0)' },
  ];

  const rawTexts = documents.map((d) => d.text);
  const labels = documents.map((d) => d.label);

  // Fit CountVectorizer and TfidfVectorizer
  const countVec = new CountVectorizer({ ngramRange: [1, 1] });
  const X_bow = countVec.fitTransform(rawTexts);
  const featureNames = countVec.getFeatureNames();

  const tfidfVec = new TfidfVectorizer({ ngramRange: [1, 1], smoothIdf: true, norm: 'l2' });
  const X_tfidf = tfidfVec.fitTransform(rawTexts);

  // Chi-Square contingency table computation
  const nDocs = documents.length;
  const chi2Features = featureNames.map((term, j) => {
    let A = 0; // Present & Class 1
    let B = 0; // Present & Class 0
    let C = 0; // Absent & Class 1
    let D = 0; // Absent & Class 0

    for (let i = 0; i < nDocs; i++) {
      const present = X_bow[i][j] > 0 ? 1 : 0;
      const label = labels[i] === 1 ? 1 : 0;

      if (present && label) A++;
      else if (present && !label) B++;
      else if (!present && label) C++;
      else D++;
    }

    const r1 = A + B; // Total present
    const r2 = C + D; // Total absent
    const c1 = A + C; // Total class 1
    const c2 = B + D; // Total class 0
    const N = nDocs;

    const E_A = (r1 * c1) / N;
    const E_B = (r1 * c2) / N;
    const E_C = (r2 * c1) / N;
    const E_D = (r2 * c2) / N;

    let chi2 = 0;
    if (E_A > 0) chi2 += (A - E_A) ** 2 / E_A;
    if (E_B > 0) chi2 += (B - E_B) ** 2 / E_B;
    if (E_C > 0) chi2 += (C - E_C) ** 2 / E_C;
    if (E_D > 0) chi2 += (D - E_D) ** 2 / E_D;

    return {
      term,
      featureIndex: j,
      contingency: { A, B, C, D },
      expected: {
        E_A: Number(E_A.toFixed(2)),
        E_B: Number(E_B.toFixed(2)),
        E_C: Number(E_C.toFixed(2)),
        E_D: Number(E_D.toFixed(2)),
      },
      chi2Score: Number(chi2.toFixed(4)),
      isDiscriminative: chi2 > 0,
    };
  });

  // Sort descending by chi-square score
  chi2Features.sort((a, b) => b.chi2Score - a.chi2Score || a.featureIndex - b.featureIndex);

  return {
    isEducational: true,
    disclaimer: 'This is an illustrative educational example with 4 toy documents. It does not replace real dataset metrics.',
    documents,
    vocabularySize: featureNames.length,
    featureNames,
    bowDemo: {
      vocabulary: featureNames.map((term, index) => ({ term, index })),
      documentVectors: documents.map((doc, idx) => ({
        text: doc.text,
        label: doc.label,
        vector: X_bow[idx],
      })),
    },
    tfidfDemo: {
      documentFrequencies: tfidfVec.documentFrequencies,
      idfWeights: tfidfVec.idfWeights.map((w) => Number(w.toFixed(4))),
      documentVectors: documents.map((doc, idx) => ({
        text: doc.text,
        label: doc.label,
        vector: X_tfidf[idx].map((v) => Number(v.toFixed(4))),
      })),
    },
    chi2Demo: {
      explanation: 'Chi-Square (χ²) measures independence between word occurrence and binary disaster class. High χ² indicates a strongly discriminative feature.',
      contingencyDefinitions: {
        A: 'Document contains term AND is Disaster (Class 1)',
        B: 'Document contains term AND is Non-Disaster (Class 0)',
        C: 'Document does NOT contain term AND is Disaster (Class 1)',
        D: 'Document does NOT contain term AND is Non-Disaster (Class 0)',
      },
      formula: 'χ² = Σ [ (O - E)² / E ] over cells A, B, C, D where E = (row_total * col_total) / N',
      features: chi2Features,
      topKSelected: chi2Features.slice(0, 5),
    },
  };
}
