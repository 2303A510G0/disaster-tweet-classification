import { describe, it, expect } from 'vitest';
import { CountVectorizer } from '../../../nlp/features/countVectorizer.js';
import { TfidfVectorizer } from '../../../nlp/features/tfidfVectorizer.js';

describe('Feature Extraction Unit Tests (T08)', () => {
  const sampleDocs = [
    'flood rescue needed',
    'rescue teams arrived',
    'flood warning issued',
  ];

  describe('A. CountVectorizer (Bag of Words)', () => {
    it('builds unigram vocabulary deterministically on fit', () => {
      const vectorizer = new CountVectorizer({ ngramRange: [1, 1] });
      vectorizer.fit(sampleDocs);

      const featureNames = vectorizer.getFeatureNames();
      // Tokens after preprocessing/stemming:
      // 'flood', 'rescu', 'need'
      // 'rescu', 'team', 'arriv'
      // 'flood', 'warn', 'issu'
      expect(featureNames).toContain('flood');
      expect(featureNames).toContain('rescu');
      expect(featureNames).toContain('need');
      expect(featureNames).toContain('team');
      expect(featureNames).toContain('arriv');
      expect(featureNames).toContain('warn');
      expect(featureNames).toContain('issu');
      expect(vectorizer.vocabulary.size).toBe(featureNames.length);
    });

    it('supports bigram extraction when ngramRange is [2, 2]', () => {
      const vectorizer = new CountVectorizer({ ngramRange: [2, 2] });
      vectorizer.fit(sampleDocs);

      const featureNames = vectorizer.getFeatureNames();
      expect(featureNames).toContain('flood rescu');
      expect(featureNames).toContain('rescu need');
      expect(featureNames).toContain('rescu team');
      expect(featureNames).toContain('team arriv');
      expect(featureNames).toContain('flood warn');
      expect(featureNames).toContain('warn issu');
      // Should not contain unigrams
      expect(featureNames).not.toContain('flood');
      expect(featureNames).not.toContain('rescu');
    });

    it('supports both unigrams and bigrams when ngramRange is [1, 2]', () => {
      const vectorizer = new CountVectorizer({ ngramRange: [1, 2] });
      vectorizer.fit(sampleDocs);

      const featureNames = vectorizer.getFeatureNames();
      expect(featureNames).toContain('flood');
      expect(featureNames).toContain('flood rescu');
      expect(featureNames).toContain('rescu');
    });

    it('counts token occurrences accurately in transform matrix', () => {
      const vectorizer = new CountVectorizer({ ngramRange: [1, 1] });
      const X = vectorizer.fitTransform([
        'flood flood rescue',
        'rescue only',
      ]);

      const floodIdx = vectorizer.vocabulary.get('flood');
      const rescuIdx = vectorizer.vocabulary.get('rescu');

      expect(X[0][floodIdx]).toBe(2);
      expect(X[0][rescuIdx]).toBe(1);
      expect(X[1][floodIdx]).toBe(0);
      expect(X[1][rescuIdx]).toBe(1);
    });

    it('ignores unknown tokens during transform without modifying vocabulary', () => {
      const vectorizer = new CountVectorizer({ ngramRange: [1, 1] });
      vectorizer.fit(['flood warning']);
      const initialVocabSize = vectorizer.vocabulary.size;

      const X = vectorizer.transform(['alien invasion unknown words']);
      expect(vectorizer.vocabulary.size).toBe(initialVocabSize);
      // All counts should be 0 because none of the words were in the training vocabulary
      const nonZeroCounts = X[0].filter((val) => val > 0);
      expect(nonZeroCounts.length).toBe(0);
    });

    it('handles empty documents safely', () => {
      const vectorizer = new CountVectorizer();
      vectorizer.fit(sampleDocs);

      const X = vectorizer.transform(['', '   ', null, undefined]);
      expect(X.length).toBe(4);
      for (const row of X) {
        expect(row.every((val) => val === 0)).toBe(true);
      }
    });

    it('throws error when transforming before fitting', () => {
      const vectorizer = new CountVectorizer();
      expect(() => vectorizer.transform(['test'])).toThrow(/not fitted/i);
    });
  });

  describe('B. TfidfVectorizer', () => {
    it('computes correct Document Frequency (DF) for training documents', () => {
      const vectorizer = new TfidfVectorizer({ ngramRange: [1, 1] });
      vectorizer.fit(sampleDocs);

      // 'flood' appears in docs 0 and 2 -> DF = 2
      // 'rescu' appears in docs 0 and 1 -> DF = 2
      // 'need' appears in doc 0 -> DF = 1
      const floodIdx = vectorizer.vocabulary.get('flood');
      const rescuIdx = vectorizer.vocabulary.get('rescu');
      const needIdx = vectorizer.vocabulary.get('need');

      expect(vectorizer.documentFrequencies[floodIdx]).toBe(2);
      expect(vectorizer.documentFrequencies[rescuIdx]).toBe(2);
      expect(vectorizer.documentFrequencies[needIdx]).toBe(1);
    });

    it('calculates smooth IDF values using the standard formula', () => {
      // Formula: idf = ln((1 + N) / (1 + DF)) + 1
      // N = 3
      // DF = 2 -> ln(4 / 3) + 1 ≈ 0.287682 + 1 = 1.287682
      // DF = 1 -> ln(4 / 2) + 1 = ln(2) + 1 ≈ 0.693147 + 1 = 1.693147
      const vectorizer = new TfidfVectorizer({ ngramRange: [1, 1] });
      vectorizer.fit(sampleDocs);

      const floodIdx = vectorizer.vocabulary.get('flood');
      const needIdx = vectorizer.vocabulary.get('need');

      const expectedFloodIdf = Math.log(4 / 3) + 1;
      const expectedNeedIdf = Math.log(4 / 2) + 1;

      expect(vectorizer.idfWeights[floodIdx]).toBeCloseTo(expectedFloodIdf, 4);
      expect(vectorizer.idfWeights[needIdx]).toBeCloseTo(expectedNeedIdf, 4);
    });

    it('calculates sublinear TF when enabled', () => {
      // sublinear TF: 1 + ln(count)
      // count = 1 -> 1 + ln(1) = 1
      // count = 2 -> 1 + ln(2) ≈ 1.693147
      const vectorizer = new TfidfVectorizer({
        ngramRange: [1, 1],
        sublinearTf: true,
        norm: null,
      });

      const X = vectorizer.fitTransform(['flood flood rescue']);
      const floodIdx = vectorizer.vocabulary.get('flood');
      const rescuIdx = vectorizer.vocabulary.get('rescu');

      const expectedFloodTf = 1 + Math.log(2);
      const expectedRescuTf = 1 + Math.log(1);

      const floodIdf = vectorizer.idfWeights[floodIdx];
      const rescuIdf = vectorizer.idfWeights[rescuIdx];

      expect(X[0][floodIdx]).toBeCloseTo(expectedFloodTf * floodIdf, 4);
      expect(X[0][rescuIdx]).toBeCloseTo(expectedRescuTf * rescuIdf, 4);
    });

    it('applies L2 normalization across feature vectors when norm="l2"', () => {
      const vectorizer = new TfidfVectorizer({
        ngramRange: [1, 1],
        norm: 'l2',
      });

      const X = vectorizer.fitTransform(sampleDocs);
      for (const row of X) {
        const squaredSum = row.reduce((sum, val) => sum + val * val, 0);
        // Euclidean norm of non-empty vector must equal 1.0
        expect(Math.sqrt(squaredSum)).toBeCloseTo(1.0, 4);
      }
    });

    it('ignores unknown tokens during transform and never mutates IDF weights', () => {
      const vectorizer = new TfidfVectorizer();
      vectorizer.fit(sampleDocs);

      const idfSnapshot = [...vectorizer.idfWeights];
      const vocabSizeSnapshot = vectorizer.vocabulary.size;

      const X = vectorizer.transform(['blizzard avalanche blizzard']);
      expect(vectorizer.vocabulary.size).toBe(vocabSizeSnapshot);
      expect(vectorizer.idfWeights).toEqual(idfSnapshot);

      // Vector should be all zeros since blizzard and avalanche are unknown
      expect(X[0].every((v) => v === 0)).toBe(true);
    });

    it('throws error when transforming before fitting', () => {
      const vectorizer = new TfidfVectorizer();
      expect(() => vectorizer.transform(['sample text'])).toThrow(/not fitted/i);
    });
  });

  describe('C. Leakage Prevention Workflow Verification', () => {
    it('demonstrates strict fit-on-train and transform-only on validation and test', () => {
      // Synthetic train / val / test documents
      const trainDocs = [
        'wildfire burning hills',
        'forest fire evacuated',
      ];
      const valDocs = [
        'wildfire spreading rapidly', // 'spreading' and 'rapidly' are val-only tokens
      ];
      const testDocs = [
        'hills on fire tsunami warning', // 'tsunami' and 'warning' are test-only tokens
      ];

      const vectorizer = new TfidfVectorizer({ ngramRange: [1, 1] });

      // Step 1: Fit strictly on training data
      vectorizer.fit(trainDocs);
      const trainVocab = vectorizer.getFeatureNames();

      // Step 2: Verify validation-only and test-only tokens did NOT leak into vocabulary
      expect(trainVocab).not.toContain('spread');
      expect(trainVocab).not.toContain('rapidli');
      expect(trainVocab).not.toContain('tsunami');
      expect(trainVocab).not.toContain('warn');

      // Step 3: Record frozen IDF weights
      const frozenIdf = [...vectorizer.idfWeights];

      // Step 4: Transform validation and test
      const X_val = vectorizer.transform(valDocs);
      const X_test = vectorizer.transform(testDocs);

      // Step 5: Assert IDF weights and vocabulary size were not mutated
      expect(vectorizer.idfWeights).toEqual(frozenIdf);
      expect(vectorizer.vocabulary.size).toBe(trainVocab.length);
      expect(X_val.length).toBe(1);
      expect(X_test.length).toBe(1);
      expect(X_val[0].length).toBe(trainVocab.length);
      expect(X_test[0].length).toBe(trainVocab.length);
    });
  });
});

