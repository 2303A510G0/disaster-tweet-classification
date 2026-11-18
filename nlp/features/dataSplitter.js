/**
 * Leakage-Safe Stratified Dataset Splitter.
 *
 * Implements deterministic stratified train/validation/test splitting using a
 * seeded Mulberry32 pseudo-random number generator (PRNG) and Fisher-Yates shuffle.
 * Preserves class distribution across all subsets with zero record leakage.
 */

/**
 * Creates a deterministic 32-bit PRNG (Mulberry32) from an integer seed.
 *
 * @param {number} seed - Integer seed (default 42).
 * @returns {() => number} Random float between 0 (inclusive) and 1 (exclusive).
 */
export function createSeededRandom(seed = 42) {
  let s = Math.floor(Math.abs(Number(seed) || 42));
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffles an array in place using the Fisher-Yates algorithm.
 *
 * @param {Array} array - Target array to shuffle.
 * @param {() => number} rng - Seeded random generator function.
 * @returns {Array} Shuffled copy of the array.
 */
function shuffleArray(array, rng) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Splits records into stratified train, validation, and test subsets.
 *
 * @param {Array<Object>} records - Array of tweet records with 'target' property.
 * @param {Object} [options] - Configuration options.
 * @param {number} [options.trainRatio=0.70] - Proportion for training set.
 * @param {number} [options.validationRatio=0.15] - Proportion for validation set.
 * @param {number} [options.testRatio=0.15] - Proportion for testing set.
 * @param {number} [options.seed=42] - PRNG seed for reproducible shuffling.
 * @param {string} [options.stratifyBy='target'] - Property key to stratify by.
 * @returns {Object} Structured subsets { train, validation, test, metadata }.
 */
export function splitDataset(records, options = {}) {
  if (!Array.isArray(records)) {
    throw new TypeError('Records must be an array.');
  }

  const trainRatio = options.trainRatio !== undefined ? options.trainRatio : 0.7;
  const validationRatio = options.validationRatio !== undefined ? options.validationRatio : 0.15;
  const testRatio = options.testRatio !== undefined ? options.testRatio : 0.15;
  const seed = options.seed !== undefined ? options.seed : 42;
  const stratifyBy = options.stratifyBy || 'target';

  // Validate ratios sum to 1.0 (with small floating point tolerance)
  const ratioSum = trainRatio + validationRatio + testRatio;
  if (Math.abs(ratioSum - 1.0) > 1e-5) {
    throw new Error(
      `Split ratios (train: ${trainRatio}, validation: ${validationRatio}, test: ${testRatio}) must sum to 1.0.`
    );
  }

  const rng = createSeededRandom(seed);

  if (records.length === 0) {
    return {
      train: [],
      validation: [],
      test: [],
      metadata: {
        seed,
        ratios: { train: trainRatio, validation: validationRatio, test: testRatio },
        total_records: 0,
        invalid_records: 0,
        split_sizes: { train: 0, validation: 0, test: 0 },
        class_distributions: {
          train: {},
          validation: {},
          test: {},
        },
      },
    };
  }

  // Group valid records by target class
  const classGroups = {};
  let invalidCount = 0;
  const validRecords = [];

  for (const record of records) {
    const rawVal = record[stratifyBy];
    const strVal = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';

    // Only allow binary 0 or 1 for disaster classification
    if (strVal !== '0' && strVal !== '1') {
      invalidCount++;
      continue;
    }

    const classLabel = strVal;
    if (!classGroups[classLabel]) {
      classGroups[classLabel] = [];
    }
    classGroups[classLabel].push(record);
    validRecords.push(record);
  }

  const trainPartitions = [];
  const valPartitions = [];
  const testPartitions = [];

  // Stratify per class
  for (const [classLabel, group] of Object.entries(classGroups)) {
    const shuffledGroup = shuffleArray(group, rng);

    const totalGroup = shuffledGroup.length;
    let nTrain = Math.round(totalGroup * trainRatio);
    let nVal = Math.round(totalGroup * validationRatio);
    let nTest = totalGroup - nTrain - nVal;

    // Handle small groups where rounding might cause nTest < 0 or nTrain < 0
    if (nTest < 0) {
      nTest = 0;
      nVal = totalGroup - nTrain;
    }

    const trainSlice = shuffledGroup.slice(0, nTrain);
    const valSlice = shuffledGroup.slice(nTrain, nTrain + nVal);
    const testSlice = shuffledGroup.slice(nTrain + nVal);

    trainPartitions.push(...trainSlice);
    valPartitions.push(...valSlice);
    testPartitions.push(...testSlice);
  }

  // Deterministically shuffle the combined partitions so classes are intermixed
  const finalTrain = shuffleArray(trainPartitions, rng);
  const finalVal = shuffleArray(valPartitions, rng);
  const finalTest = shuffleArray(testPartitions, rng);

  // Compute per-partition class distribution
  const countClasses = (arr) => {
    const counts = {};
    for (const r of arr) {
      const label = String(r[stratifyBy]);
      counts[label] = (counts[label] || 0) + 1;
    }
    return counts;
  };

  return {
    train: finalTrain,
    validation: finalVal,
    test: finalTest,
    metadata: {
      seed,
      ratios: {
        train: trainRatio,
        validation: validationRatio,
        test: testRatio,
      },
      total_records: validRecords.length,
      invalid_records: invalidCount,
      split_sizes: {
        train: finalTrain.length,
        validation: finalVal.length,
        test: finalTest.length,
      },
      class_distributions: {
        train: countClasses(finalTrain),
        validation: countClasses(finalVal),
        test: countClasses(finalTest),
      },
    },
  };
}

