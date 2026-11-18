import { preprocessText } from '../preprocessing/preprocessText.js';

/**
 * Generates n-grams of specified range from an array of tokens.
 *
 * @param {string[]} tokens - Array of preprocessed word tokens.
 * @param {number} minN - Minimum n-gram size.
 * @param {number} maxN - Maximum n-gram size.
 * @returns {string[]} List of n-gram terms.
 */
export function extractNgrams(tokens, minN = 1, maxN = 1) {
  if (!Array.isArray(tokens) || tokens.length === 0) return [];
  const ngrams = [];
  const len = tokens.length;

  for (let n = minN; n <= maxN; n++) {
    for (let i = 0; i <= len - n; i++) {
      const gram = tokens.slice(i, i + n).join(' ');
      ngrams.push(gram);
    }
  }

  return ngrams;
}

/**
 * CountVectorizer (Bag of Words) for Disaster Tweets text classification.
 * Learns vocabulary during fit() and transforms documents into count vectors.
 */
export class CountVectorizer {
  constructor(options = {}) {
    this.ngramRange = options.ngramRange || [1, 1];
    this.minDf = options.minDf || 1;
    this.maxFeatures = options.maxFeatures || null;
    this.lowercase = options.lowercase !== false;
    this.removeStopWords = options.removeStopWords !== false;
    this.stemming = options.stemming !== false;
    this.preserveNegation = options.preserveNegation !== false;

    this.vocabulary = new Map(); // term -> feature index
    this.featureNames = []; // feature index -> term
    this.isFitted = false;
  }

  /**
   * Tokenizes a raw text document using the preprocessing pipeline.
   *
   * @param {string} doc - Raw tweet text.
   * @returns {string[]} Preprocessed tokens.
   */
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
   * Fits vocabulary exclusively on training documents.
   *
   * @param {string[]} documents - Array of raw training tweet strings.
   * @returns {CountVectorizer} this.
   */
  fit(documents) {
    if (!Array.isArray(documents)) {
      throw new TypeError('Documents must be an array of strings.');
    }

    const [minN, maxN] = this.ngramRange;
    const docFrequencies = new Map(); // term -> document count
    const termsSeen = new Set();

    for (const doc of documents) {
      const tokens = this.tokenizeDocument(doc);
      const ngrams = extractNgrams(tokens, minN, maxN);
      const uniqueDocNgrams = new Set(ngrams);

      for (const term of uniqueDocNgrams) {
        docFrequencies.set(term, (docFrequencies.get(term) || 0) + 1);
        termsSeen.add(term);
      }
    }

    // Filter by minDf
    let validTerms = [...termsSeen].filter((term) => docFrequencies.get(term) >= this.minDf);

    // Sort alphabetically for deterministic vocabulary ordering
    validTerms.sort();

    if (this.maxFeatures && validTerms.length > this.maxFeatures) {
      // Sort by document frequency descending, then alphabetically
      validTerms.sort((a, b) => {
        const dfDiff = docFrequencies.get(b) - docFrequencies.get(a);
        return dfDiff !== 0 ? dfDiff : a.localeCompare(b);
      });
      validTerms = validTerms.slice(0, this.maxFeatures).sort();
    }

    this.vocabulary = new Map();
    this.featureNames = [];

    for (let i = 0; i < validTerms.length; i++) {
      const term = validTerms[i];
      this.vocabulary.set(term, i);
      this.featureNames.push(term);
    }

    this.isFitted = true;
    return this;
  }

  /**
   * Transforms documents into Bag of Words count vectors.
   *
   * @param {string[]} documents - Array of document strings.
   * @returns {number[][]} 2D count matrix.
   */
  transform(documents) {
    if (!this.isFitted) {
      throw new Error('CountVectorizer is not fitted. Call fit() before transform().');
    }
    if (!Array.isArray(documents)) {
      throw new TypeError('Documents must be an array of strings.');
    }

    const numFeatures = this.featureNames.length;
    const [minN, maxN] = this.ngramRange;
    const matrix = [];

    for (const doc of documents) {
      const row = new Array(numFeatures).fill(0);
      const tokens = this.tokenizeDocument(doc);
      const ngrams = extractNgrams(tokens, minN, maxN);

      for (const gram of ngrams) {
        if (this.vocabulary.has(gram)) {
          const idx = this.vocabulary.get(gram);
          row[idx] += 1;
        }
      }

      matrix.push(row);
    }

    return matrix;
  }

  /**
   * Fits on documents and transforms them in a single step.
   *
   * @param {string[]} documents - Training documents.
   * @returns {number[][]} Count matrix.
   */
  fitTransform(documents) {
    return this.fit(documents).transform(documents);
  }

  /**
   * Returns feature names (terms) corresponding to column indexes.
   *
   * @returns {string[]} Array of vocabulary terms.
   */
  getFeatureNames() {
    return [...this.featureNames];
  }
}

