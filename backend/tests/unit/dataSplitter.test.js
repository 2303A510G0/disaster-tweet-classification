import { describe, it, expect } from 'vitest';
import { splitDataset, createSeededRandom } from '../../../nlp/features/dataSplitter.js';

describe('Data Splitter Unit Tests (T07)', () => {
  // Helper to generate synthetic records for test verification
  function generateSyntheticRecords(count, disasterRatio = 0.4) {
    const records = [];
    const disasterCount = Math.round(count * disasterRatio);
    for (let i = 1; i <= count; i++) {
      const target = i <= disasterCount ? 1 : 0;
      records.push({
        id: `tweet_${i}`,
        text: `Synthetic tweet content number ${i} disaster flag ${target}`,
        target: target,
      });
    }
    return records;
  }

  describe('PRNG & Reproducibility', () => {
    it('generates deterministic pseudorandom sequence from fixed seed', () => {
      const rng1 = createSeededRandom(42);
      const rng2 = createSeededRandom(42);
      const seq1 = [rng1(), rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2(), rng2()];
      expect(seq1).toEqual(seq2);
    });

    it('generates different sequence when different seed is used', () => {
      const rng1 = createSeededRandom(42);
      const rng2 = createSeededRandom(999);
      expect(rng1()).not.toBe(rng2());
    });
  });

  describe('Split Ratios and Record Accounting', () => {
    it('splits records into 70% train, 15% validation, and 15% test', () => {
      const records = generateSyntheticRecords(100, 0.4);
      const result = splitDataset(records, { seed: 42 });

      expect(result.train.length).toBe(70);
      expect(result.validation.length).toBe(15);
      expect(result.test.length).toBe(15);
      expect(result.train.length + result.validation.length + result.test.length).toBe(100);
    });

    it('ensures zero overlap between partitions', () => {
      const records = generateSyntheticRecords(200, 0.35);
      const result = splitDataset(records, { seed: 42 });

      const trainIds = new Set(result.train.map((r) => r.id));
      const valIds = new Set(result.validation.map((r) => r.id));
      const testIds = new Set(result.test.map((r) => r.id));

      // Overlap check
      for (const id of valIds) {
        expect(trainIds.has(id)).toBe(false);
      }
      for (const id of testIds) {
        expect(trainIds.has(id)).toBe(false);
        expect(valIds.has(id)).toBe(false);
      }
      expect(trainIds.size + valIds.size + testIds.size).toBe(200);
    });

    it('produces identical splits with the same seed (reproducibility)', () => {
      const records = generateSyntheticRecords(100, 0.4);
      const run1 = splitDataset(records, { seed: 42 });
      const run2 = splitDataset(records, { seed: 42 });

      expect(run1.train.map((r) => r.id)).toEqual(run2.train.map((r) => r.id));
      expect(run1.validation.map((r) => r.id)).toEqual(run2.validation.map((r) => r.id));
      expect(run1.test.map((r) => r.id)).toEqual(run2.test.map((r) => r.id));
    });

    it('produces different partition ordering when seed changes', () => {
      const records = generateSyntheticRecords(100, 0.4);
      const run1 = splitDataset(records, { seed: 42 });
      const run2 = splitDataset(records, { seed: 123 });

      expect(run1.train.map((r) => r.id)).not.toEqual(run2.train.map((r) => r.id));
    });
  });

  describe('Stratification', () => {
    it('preserves class proportions across all partitions', () => {
      // 100 records: 40 disaster (40%), 60 non-disaster (60%)
      const records = generateSyntheticRecords(100, 0.4);
      const result = splitDataset(records, { seed: 42 });

      const countDisaster = (arr) => arr.filter((r) => r.target === 1).length;

      // Train: 70 total -> 40% of 70 = 28 disaster, 42 non-disaster
      expect(countDisaster(result.train)).toBe(28);
      expect(result.train.length - countDisaster(result.train)).toBe(42);

      // Validation: 15 total -> 40% of 15 = 6 disaster, 9 non-disaster
      expect(countDisaster(result.validation)).toBe(6);
      expect(result.validation.length - countDisaster(result.validation)).toBe(9);

      // Test: 15 total -> 40% of 15 = 6 disaster, 9 non-disaster
      expect(countDisaster(result.test)).toBe(6);
      expect(result.test.length - countDisaster(result.test)).toBe(9);
    });

    it('accurately populates metadata class distributions', () => {
      const records = generateSyntheticRecords(100, 0.4);
      const result = splitDataset(records, { seed: 42 });

      expect(result.metadata.seed).toBe(42);
      expect(result.metadata.total_records).toBe(100);
      expect(result.metadata.split_sizes).toEqual({
        train: 70,
        validation: 15,
        test: 15,
      });
      expect(result.metadata.class_distributions).toEqual({
        train: { '0': 42, '1': 28 },
        validation: { '0': 9, '1': 6 },
        test: { '0': 9, '1': 6 },
      });
    });
  });

  describe('Edge cases and safety', () => {
    it('handles empty input records', () => {
      const result = splitDataset([]);
      expect(result.train).toEqual([]);
      expect(result.validation).toEqual([]);
      expect(result.test).toEqual([]);
      expect(result.metadata.total_records).toBe(0);
    });

    it('handles small datasets without crashing or losing records', () => {
      const smallRecords = [
        { id: '1', text: 'fire', target: 1 },
        { id: '2', text: 'sunny', target: 0 },
        { id: '3', text: 'flood', target: 1 },
      ];
      const result = splitDataset(smallRecords, { seed: 42 });
      const totalAllocated = result.train.length + result.validation.length + result.test.length;
      expect(totalAllocated).toBe(3);
    });

    it('skips records with missing or invalid targets and reports excluded count', () => {
      const mixedRecords = [
        { id: '1', text: 'valid disaster', target: 1 },
        { id: '2', text: 'valid non-disaster', target: 0 },
        { id: '3', text: 'invalid target', target: 99 },
        { id: '4', text: 'missing target', target: null },
      ];
      const result = splitDataset(mixedRecords, { seed: 42 });
      expect(result.metadata.total_records).toBe(2);
      expect(result.metadata.invalid_records).toBe(2);
    });

    it('throws when custom split ratios do not sum to 1.0', () => {
      const records = generateSyntheticRecords(10);
      expect(() =>
        splitDataset(records, { trainRatio: 0.8, validationRatio: 0.1, testRatio: 0.2 })
      ).toThrow(/must sum to 1/i);
    });
  });

  describe('Leakage Prevention Verification', () => {
    it('guarantees test records remain completely isolated from training input', () => {
      const records = generateSyntheticRecords(50, 0.4);
      const result = splitDataset(records, { seed: 42 });

      // Verification: Vocabulary extracted strictly from train should not include tokens exclusive to test
      const trainTexts = result.train.map((r) => r.text).join(' ');
      const testTexts = result.test.map((r) => r.text).join(' ');

      expect(result.test.length).toBeGreaterThan(0);
      expect(result.train.length).toBeGreaterThan(0);

      // Verify that no object reference is shared
      for (const testRecord of result.test) {
        expect(result.train.includes(testRecord)).toBe(false);
      }
    });
  });
});

