import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

/**
 * Loads and performs exploratory analysis on a Disaster Tweets CSV dataset.
 *
 * @param {string} filePath - Absolute or relative path to CSV dataset file.
 * @returns {Promise<Object>} Summary statistics and metadata.
 */
export async function loadAndAnalyzeDataset(filePath) {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    const error = new Error(`Dataset file not found at: ${resolvedPath}`);
    error.code = 'DATASET_MISSING';
    error.statusCode = 503;
    throw error;
  }

  let fileContent;
  try {
    fileContent = fs.readFileSync(resolvedPath, 'utf-8');
  } catch (err) {
    const error = new Error(`Failed to read dataset file: ${err.message}`);
    error.statusCode = 500;
    throw error;
  }

  let records;
  try {
    records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    });
  } catch (err) {
    const error = new Error(`Malformed CSV dataset: ${err.message}`);
    error.statusCode = 422;
    throw error;
  }

  if (!records || records.length === 0) {
    const error = new Error('Dataset file is empty or contains no records.');
    error.statusCode = 422;
    throw error;
  }

  const columns = Object.keys(records[0] || {});
  const requiredColumns = ['text', 'target'];

  for (const reqCol of requiredColumns) {
    if (!columns.includes(reqCol)) {
      const error = new Error(
        `Missing required column '${reqCol}'. Expected columns: [${requiredColumns.join(', ')}], found: [${columns.join(', ')}]`
      );
      error.statusCode = 422;
      throw error;
    }
  }

  // Column missing value counters
  const missingValues = {};
  for (const col of columns) {
    missingValues[col] = 0;
  }

  const validRecords = [];
  let invalidRecords = 0;
  let disasterCount = 0;
  let nonDisasterCount = 0;

  const seenRecords = new Set();
  let duplicateCount = 0;
  const sampleRecords = [];

  for (const record of records) {
    // Track missing values
    for (const col of columns) {
      const val = record[col];
      if (val === undefined || val === null || String(val).trim() === '') {
        missingValues[col]++;
      }
    }

    const textVal = record.text !== undefined && record.text !== null ? String(record.text).trim() : '';
    const rawTarget = record.target !== undefined && record.target !== null ? String(record.target).trim() : '';

    const isTargetValid = rawTarget === '0' || rawTarget === '1';
    const isTextValid = textVal.length > 0;

    if (!isTextValid || !isTargetValid) {
      invalidRecords++;
      continue;
    }

    const targetNum = Number.parseInt(rawTarget, 10);
    validRecords.push({
      ...record,
      text: textVal,
      target: targetNum,
    });

    if (targetNum === 1) {
      disasterCount++;
    } else {
      nonDisasterCount++;
    }

    // Duplicate detection (composite signature: text + target)
    const recordSig = `${textVal}|||${targetNum}`;
    if (seenRecords.has(recordSig)) {
      duplicateCount++;
    } else {
      seenRecords.add(recordSig);
    }

    if (sampleRecords.length < 5) {
      sampleRecords.push({
        ...record,
        target: targetNum,
      });
    }
  }

  const validCount = validRecords.length;
  const disasterPct = validCount > 0 ? Number(((disasterCount / validCount) * 100).toFixed(2)) : 0;
  const nonDisasterPct = validCount > 0 ? Number(((nonDisasterCount / validCount) * 100).toFixed(2)) : 0;

  return {
    status: 'available',
    filename: path.basename(resolvedPath),
    total_records: records.length,
    valid_records: validCount,
    invalid_records: invalidRecords,
    duplicate_records: duplicateCount,
    columns,
    class_distribution: {
      disaster: disasterCount,
      non_disaster: nonDisasterCount,
    },
    class_percentages: {
      disaster: disasterPct,
      non_disaster: nonDisasterPct,
    },
    missing_values: missingValues,
    sample_records: sampleRecords,
    records: validRecords,
  };
}

