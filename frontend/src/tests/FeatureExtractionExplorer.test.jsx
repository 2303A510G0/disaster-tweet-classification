/**
 * FeatureExtractionExplorer.test.jsx — Unit & Integration Tests for Feature Extraction Page (T15)
 *
 * Follows strict TDD (RED phase before component implementation).
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FeatureExtractionExplorer } from '../pages/FeatureExtractionExplorer.jsx';
import * as featuresApi from '../api/featuresApi.js';

describe('FeatureExtractionExplorer Page Component Tests (T15)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockEducationalDemo = {
    isEducational: true,
    disclaimer: 'This is an illustrative educational example with 4 toy documents.',
    documents: [
      { text: 'forest fire evacuation alert in city', label: 1, labelName: 'Disaster (1)' },
      { text: 'earthquake damage severe emergency rescue', label: 1, labelName: 'Disaster (1)' },
      { text: 'great party tonight having fun with friends', label: 0, labelName: 'Non-Disaster (0)' },
      { text: 'sunny day beach vacation beautiful weather', label: 0, labelName: 'Non-Disaster (0)' },
    ],
    vocabularySize: 14,
    featureNames: ['alert', 'beach', 'damag', 'earthquak', 'evacu', 'fire', 'forest', 'parti', 'rescu'],
    bowDemo: {
      vocabulary: [
        { term: 'alert', index: 0 },
        { term: 'fire', index: 1 },
      ],
      documentVectors: [
        { text: 'forest fire evacuation alert in city', label: 1, vector: [1, 1, 0, 0] },
      ],
    },
    tfidfDemo: {
      documentFrequencies: [1, 1],
      idfWeights: [1.9163, 1.9163],
      documentVectors: [
        { text: 'forest fire evacuation alert in city', label: 1, vector: [0.577, 0.577] },
      ],
    },
    chi2Demo: {
      explanation: 'Chi-Square (χ²) measures independence between word occurrence and binary disaster class.',
      contingencyDefinitions: {
        A: 'Document contains term AND is Disaster (Class 1)',
        B: 'Document contains term AND is Non-Disaster (Class 0)',
        C: 'Document does NOT contain term AND is Disaster (Class 1)',
        D: 'Document does NOT contain term AND is Non-Disaster (Class 0)',
      },
      formula: 'χ² = Σ [ (O - E)² / E ]',
      features: [
        {
          term: 'fire',
          featureIndex: 0,
          contingency: { A: 1, B: 0, C: 1, D: 2 },
          expected: { E_A: 0.5, E_B: 0.5, E_C: 1.5, E_D: 1.5 },
          chi2Score: 1.3333,
          isDiscriminative: true,
        },
      ],
      topKSelected: [
        { term: 'fire', chi2Score: 1.3333 },
      ],
    },
  };

  it('renders page header, dataset status banner, and the 3 core concept sections', async () => {
    vi.spyOn(featuresApi, 'getDatasetFeaturesInfo').mockResolvedValue({
      isTrained: false,
      datasetAvailable: false,
      modelLoaded: false,
      message: 'Dataset features not loaded. Train a model or place train.csv to inspect dataset-derived vocabulary.',
    });

    vi.spyOn(featuresApi, 'getEducationalDemo').mockResolvedValue(mockEducationalDemo);

    render(
      <MemoryRouter>
        <FeatureExtractionExplorer />
      </MemoryRouter>
    );

    expect(screen.getByText('Feature Extraction & Selection Explorer')).toBeInTheDocument();

    await waitFor(() => {
      // Core sections
      expect(screen.getByText(/Section A: Bag of Words \(CountVectorizer\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Section B: TF-IDF Vectorizer \(TfidfVectorizer\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Section C: Chi-Square Feature Selection \(χ²\)/i)).toBeInTheDocument();
    });

    // Dataset unavailable status
    expect(screen.getByText(/Dataset-Trained Features Status/i)).toBeInTheDocument();
    expect(screen.getByText(/Not Loaded \/ Unavailable/i)).toBeInTheDocument();
  });

  it('renders educational Bag of Words vocabulary and TF-IDF formulas', async () => {
    vi.spyOn(featuresApi, 'getDatasetFeaturesInfo').mockResolvedValue({
      isTrained: false,
      datasetAvailable: false,
      modelLoaded: false,
    });
    vi.spyOn(featuresApi, 'getEducationalDemo').mockResolvedValue(mockEducationalDemo);

    render(
      <MemoryRouter>
        <FeatureExtractionExplorer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Term Frequency-Inverse Document Frequency/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/L2 Normalization/i)).toBeInTheDocument();
      expect(screen.getByText(/2×2 Contingency Table/i)).toBeInTheDocument();
    });
  });

  it('allows interactive feature extraction on custom input text', async () => {
    vi.spyOn(featuresApi, 'getDatasetFeaturesInfo').mockResolvedValue({
      isTrained: false,
      datasetAvailable: false,
    });
    vi.spyOn(featuresApi, 'getEducationalDemo').mockResolvedValue(mockEducationalDemo);

    const extractSpy = vi.spyOn(featuresApi, 'extractFeatures').mockResolvedValue({
      text: 'wildfire evacuation',
      ngramRange: [1, 1],
      referenceCorpusSize: 5,
      bow: {
        featureNames: ['evacu', 'wildfir'],
        vocabulary: [{ term: 'evacu', index: 0 }, { term: 'wildfir', index: 1 }],
        tokenCounts: [{ term: 'evacu', index: 0, count: 1 }, { term: 'wildfir', index: 1, count: 1 }],
        activeTokens: [{ term: 'evacu', index: 0, count: 1 }, { term: 'wildfir', index: 1, count: 1 }],
        denseVector: [1, 1],
        totalFeatures: 2,
      },
      tfidf: {
        terms: [
          { term: 'evacu', index: 0, tf: 1, df: 1, idf: 1.9163, tfidf: 0.7071 },
          { term: 'wildfir', index: 1, tf: 1, df: 1, idf: 1.9163, tfidf: 0.7071 },
        ],
        activeTerms: [
          { term: 'evacu', index: 0, tf: 1, df: 1, idf: 1.9163, tfidf: 0.7071 },
          { term: 'wildfir', index: 1, tf: 1, df: 1, idf: 1.9163, tfidf: 0.7071 },
        ],
        denseVector: [0.7071, 0.7071],
        norm: 'l2',
        smoothIdf: true,
        sublinearTf: false,
      },
    });

    render(
      <MemoryRouter>
        <FeatureExtractionExplorer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter custom tweet to extract features/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Enter custom tweet to extract features/i);
    fireEvent.change(input, { target: { value: 'wildfire evacuation' } });

    const extractBtn = screen.getByRole('button', { name: /Extract Features/i });
    fireEvent.click(extractBtn);

    await waitFor(() => {
      expect(extractSpy).toHaveBeenCalled();
      expect(screen.getAllByText('0.7071')[0]).toBeInTheDocument();
    });
  });
});
