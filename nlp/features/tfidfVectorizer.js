import { preprocessText } from '../preprocessing/preprocessText.js';
import { extractNgrams } from './countVectorizer.js';

/**
 * TfidfVectorizer for Disaster Tweets text classification.
 *
 * Implements standard Term Frequency-Inverse Document Frequency feature extraction
 * with smooth IDF and optional sublinear TF and L2 vector normalization.
 *
 * Mathematical formulas:
 * - Smooth IDF: IDF(t) = ln((1 + N) / (1 + DF(t))) + 1
 * - Sublinear TF: TF(t, d) = 1 + ln(count(t, d)) if count > 0 else 0
 * - TF-IDF: TFIDF(t, d) = TF(t, d) * IDF(t)
 * - L2 Norm: v_hat = v / sqrt(sum(v_i^2))
 */
export class TfidfVectorizer {
  constructor(options = {}) {
    this.ngramRange = options.ngramRange || [1, 1];
    this.minDf = options.minDf || 1;
    this.maxFeatures = options.maxFeatures || null;
    this.sublinearTf = options.sublinearTf === true;
    this.norm = options.norm !== undefined ? options.norm : 'l2';
    this.smoothIdf = options.smoothIdf !== false; // default true
    this.lowercase = options.lowercase !== false;
    this.removeStopWords = options.removeStopWords !== false;
    this.stemming = options.stemming !== false;
    this.preserveNegation = options.preserveNegation !== false;

    this.vocabulary = new Map(); // term -> index
    this.featureNames = []; // index -> term
    this.documentFrequencies = []; // index -> DF
    this.idfWeights = []; // index -> IDF weight
    this.nTrainingDocs = 0;
    this.isFitted = false;
  }

  tokenizeDocument(doc) {
    if (doc === null || doc === undefined) return [];
    const text = typeof doc === 'string' ? doc : String(doc);
    const preprocessed = preprocessText(text, {
      lowercase: this.lowercase,
      removeStopWords: this.removeStopWords,
      stemming: this.stemming,
      preserveNegation: this.preserveNegation,
    });
    return this.stemming ? preprocessed.stemmed_tokens : preprocessed.filtered_tokens;
  }

  /**
   * Fits vocabulary and calculates IDF weights strictly on training documents.
   *
   * @param {string[]} documents - Training documents.
   * @returns {TfidfVectorizer} this.
   */
  fit(documents) {
    if (!Array.isArray(documents)) {
      throw new TypeError('Documents must be an array of strings.');
    }

    const N = documents.length;
    this.nTrainingDocs = N;

    const [minN, maxN] = this.ngramRange;
    const docFreqMap = new Map();
    const termsSeen = new Set();

    for (const doc of documents) {
      const tokens = this.tokenizeDocument(doc);
      const ngrams = extractNgrams(tokens, minN, maxN);
      const uniqueGrams = new Set(ngrams);

      for (const term of uniqueGrams) {
        docFreqMap.set(term, (docFreqMap.get(term) || 0) + 1);
        termsSeen.add(term);
      }
    }

    // Filter by minDf
    let validTerms = [...termsSeen].filter((term) => docFreqMap.get(term) >= this.minDf);
    validTerms.sort();

    if (this.maxFeatures && validTerms.length > this.maxFeatures) {
      validTerms.sort((a, b) => {
        const dfDiff = docFreqMap.get(b) - docFreqMap.get(a);
        return dfDiff !== 0 ? dfDiff : a.localeCompare(b);
      });
      validTerms = validTerms.slice(0, this.maxFeatures).sort();
    }

    this.vocabulary = new Map();
    this.featureNames = [];
    this.documentFrequencies = [];
    this.idfWeights = [];

    for (let i = 0; i < validTerms.length; i++) {
      const term = validTerms[i];
      const df = docFreqMap.get(term) || 0;

      this.vocabulary.set(term, i);
      this.featureNames.push(term);
      this.documentFrequencies.push(df);

      // Smooth IDF formula: ln((1 + N) / (1 + DF)) + 1
      const idf = this.smoothIdf ? Math.log((1 + N) / (1 + df)) + 1 : Math.log(N / df) + 1;

      this.idfWeights.push(idf);
    }

    this.isFitted = true;
    return this;
  }

  /**
   * Transforms documents into normalized TF-IDF feature vectors.
   *
   * @param {string[]} documents - Array of document strings.
   * @returns {number[][]} TF-IDF matrix.
   */
  transform(documents) {
    if (!this.isFitted) {
      throw new Error('TfidfVectorizer is not fitted. Call fit() before transform().');
    }
    if (!Array.isArray(documents)) {
      throw new TypeError('Documents must be an array of strings.');
    }

    const numFeatures = this.featureNames.length;
    const [minN, maxN] = this.ngramRange;
    const matrix = [];

    for (const doc of documents) {
      const counts = new Map();
      const tokens = this.tokenizeDocument(doc);
      const ngrams = extractNgrams(tokens, minN, maxN);

      for (const gram of ngrams) {
        if (this.vocabulary.has(gram)) {
          const idx = this.vocabulary.get(gram);
          counts.set(idx, (counts.get(idx) || 0) + 1);
        }
      }

      const row = new Array(numFeatures).fill(0);

      // Compute TF * IDF
      for (const [idx, count] of counts.entries()) {
        let tf = count;
        if (this.sublinearTf && count > 0) {
          tf = 1 + Math.log(count);
        }
        const idf = this.idfWeights[idx];
        row[idx] = tf * idf;
      }

      // Optional L2 Normalization
      if (this.norm === 'l2') {
        let sumSquares = 0;
        for (let i = 0; i < numFeatures; i++) {
          sumSquares += row[i] * row[i];
        }
        if (sumSquares > 0) {
          const l2Norm = Math.sqrt(sumSquares);
          for (let i = 0; i < numFeatures; i++) {
            row[i] = row[i] / l2Norm;
          }
        }
      }

      matrix.push(row);
    }

    return matrix;
  }

  fitTransform(documents) {
    return this.fit(documents).transform(documents);
  }

  getFeatureNames() {
    return [...this.featureNames];
  }
}

