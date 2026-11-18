import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { loadAndAnalyzeDataset } from '../../../nlp/ingestion/datasetLoader.js';

describe('datasetLoader unit tests', () => {
  it('throws or reports error when file does not exist', async () => {
    const nonExistentPath = path.join(os.tmpdir(), 'non_existent_disaster_tweets.csv');
    if (fs.existsSync(nonExistentPath)) fs.unlinkSync(nonExistentPath);

    await expect(loadAndAnalyzeDataset(nonExistentPath)).rejects.toThrow(/not found|does not exist/i);
  });

  it('correctly parses a valid CSV fixture with multiline text and quotes', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nlp-test-'));
    const fixturePath = path.join(tmpDir, 'valid.csv');

    const csvContent = [
      'id,keyword,location,text,target',
      '1,earthquake,California,"Major earthquake shockwave in downtown! Stay safe.",1',
      '2,,,Just enjoying a calm afternoon with coffee,0',
      '3,fire,"New York, NY","Huge fire outbreak\nEmergency services on scene",1',
      '4,flood,,River overflowed into street,1',
      '5,,,"No emergency here, sunny day",0',
    ].join('\n');

    fs.writeFileSync(fixturePath, csvContent, 'utf-8');

    const summary = await loadAndAnalyzeDataset(fixturePath);

    expect(summary.status).toBe('available');
    expect(summary.filename).toBe('valid.csv');
    expect(summary.total_records).toBe(5);
    expect(summary.valid_records).toBe(5);
    expect(summary.invalid_records).toBe(0);
    expect(summary.duplicate_records).toBe(0);
    expect(summary.columns).toEqual(['id', 'keyword', 'location', 'text', 'target']);
    expect(summary.class_distribution).toEqual({
      disaster: 3,
      non_disaster: 2,
    });
    expect(summary.class_percentages.disaster).toBe(60);
    expect(summary.class_percentages.non_disaster).toBe(40);
    expect(summary.missing_values).toEqual({
      id: 0,
      keyword: 2,
      location: 3,
      text: 0,
      target: 0,
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('detects duplicate text records and handles invalid target values', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nlp-test-'));
    const fixturePath = path.join(tmpDir, 'duplicates_and_invalid.csv');

    const csvContent = [
      'id,keyword,location,text,target',
      '1,fire,,Severe fire on 5th avenue,1',
      '2,fire,,Severe fire on 5th avenue,1', // Duplicate text & target
      '3,,,Invalid record missing text,1',
      '4,flood,,Flood warning issued,99', // Invalid target
      '5,,,Normal tweet text,0',
    ].join('\n');

    // Replace line 3 text with empty
    const adjustedContent = csvContent.replace('Invalid record missing text', '');
    fs.writeFileSync(fixturePath, adjustedContent, 'utf-8');

    const summary = await loadAndAnalyzeDataset(fixturePath);

    expect(summary.total_records).toBe(5);
    expect(summary.duplicate_records).toBe(1);
    expect(summary.invalid_records).toBe(2); // line 3 has empty text, line 4 has target=99
    expect(summary.valid_records).toBe(3);
    expect(summary.class_distribution.disaster).toBe(2);
    expect(summary.class_distribution.non_disaster).toBe(1);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('fails with validation error if required columns (text or target) are missing', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nlp-test-'));
    const fixturePath = path.join(tmpDir, 'missing_columns.csv');

    const csvContent = [
      'id,headline,category',
      '1,Earthquake in Chile,news',
    ].join('\n');

    fs.writeFileSync(fixturePath, csvContent, 'utf-8');

    await expect(loadAndAnalyzeDataset(fixturePath)).rejects.toThrow(/Missing required column/i);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

