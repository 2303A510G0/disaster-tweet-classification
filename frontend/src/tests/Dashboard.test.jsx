/**
 * Dashboard.test.jsx — Unit & Integration Tests for Dashboard Page (T14)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard.jsx';
import * as datasetApi from '../api/datasetApi.js';
import * as modelApi from '../api/modelApi.js';

// Mock react-router-dom outlet context
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => ({
      isConnected: true,
      isChecking: false,
      serverInfo: { status: 'ok', app_name: 'Test API', version: '1.0.0' },
      refreshHealth: vi.fn(),
    }),
  };
});

describe('Dashboard Page Component Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders overview cards and handles missing dataset state', async () => {
    vi.spyOn(datasetApi, 'getDatasetSummary').mockRejectedValue({
      status: 503,
      code: 'DATASET_MISSING',
      message: 'Dataset not found at data/raw/train.csv',
    });

    vi.spyOn(modelApi, 'getModelStatus').mockResolvedValue({
      status: 'success',
      data: {
        datasetAvailable: false,
        trainingStatus: 'idle',
        isTraining: false,
        modelLoaded: false,
        selectedModel: null,
        artifactAvailable: false,
      },
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Header and Architecture
    expect(screen.getByText('Disaster Tweets Classification Platform')).toBeInTheDocument();
    expect(screen.getByText(/Project Pipeline Architecture/i)).toBeInTheDocument();

    // Waiting for async hook loading
    await waitFor(() => {
      expect(screen.getByText(/File Missing: data\/raw\/train.csv/i)).toBeInTheDocument();
    });

    // Shows unavailable state for dataset metrics
    expect(screen.getByText(/No dataset loaded/i)).toBeInTheDocument();
  });

  it('displays real dataset summary statistics when dataset is available', async () => {
    vi.spyOn(datasetApi, 'getDatasetSummary').mockResolvedValue({
      status: 'available',
      filename: 'train.csv',
      total_records: 7613,
      valid_records: 7613,
      invalid_records: 0,
      duplicate_records: 110,
      columns: ['id', 'keyword', 'location', 'text', 'target'],
      class_distribution: { disaster: 3271, non_disaster: 4342 },
      class_percentages: { disaster: 42.97, non_disaster: 57.03 },
      missing_values: { id: 0, keyword: 61, location: 2533, text: 0, target: 0 },
      sample_records: [],
    });

    vi.spyOn(modelApi, 'getModelStatus').mockResolvedValue({
      status: 'success',
      data: {
        datasetAvailable: true,
        trainingStatus: 'trained',
        isTraining: false,
        modelLoaded: true,
        selectedModel: 'MultinomialNaiveBayes',
        artifactAvailable: true,
      },
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      // 7,613 total records
      expect(screen.getAllByText('7,613')[0]).toBeInTheDocument();
      // 3,271 disaster records
      expect(screen.getAllByText('3,271')[0]).toBeInTheDocument();
      // 4,342 non-disaster records
      expect(screen.getAllByText('4,342')[0]).toBeInTheDocument();
      // Model name
      expect(screen.getByText('MultinomialNaiveBayes')).toBeInTheDocument();
    });

    // Distribution visualization chart renders
    expect(screen.getByText(/Class Distribution/i)).toBeInTheDocument();
    expect(screen.getAllByText(/42.97%/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/57.03%/)[0]).toBeInTheDocument();
  });

  it('refresh button triggers data re-fetch', async () => {
    const getSummarySpy = vi.spyOn(datasetApi, 'getDatasetSummary').mockResolvedValue({
      status: 'available',
      total_records: 100,
      class_distribution: { disaster: 40, non_disaster: 60 },
      class_percentages: { disaster: 40.0, non_disaster: 60.0 },
    });

    const getStatusSpy = vi.spyOn(modelApi, 'getModelStatus').mockResolvedValue({
      status: 'success',
      data: {
        datasetAvailable: true,
        trainingStatus: 'idle',
        modelLoaded: false,
        selectedModel: null,
      },
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getSummarySpy).toHaveBeenCalledTimes(1);
      expect(getStatusSpy).toHaveBeenCalledTimes(1);
    });

    const refreshBtn = screen.getByRole('button', { name: /Refresh Status/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(getSummarySpy).toHaveBeenCalledTimes(2);
      expect(getStatusSpy).toHaveBeenCalledTimes(2);
    });
  });
});
