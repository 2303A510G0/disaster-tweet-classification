/**
 * DatasetExplorer.test.jsx — Unit & Integration Tests for Dataset Explorer Page (T14)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DatasetExplorer } from '../pages/DatasetExplorer.jsx';
import * as datasetApi from '../api/datasetApi.js';

describe('DatasetExplorer Page Component Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Kaggle schema specification section unconditionally', async () => {
    vi.spyOn(datasetApi, 'getDatasetSummary').mockRejectedValue({
      status: 503,
      code: 'DATASET_MISSING',
      message: 'Dataset not found',
    });

    render(
      <MemoryRouter>
        <DatasetExplorer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dataset Explorer & EDA')).toBeInTheDocument();
      expect(screen.getByText('Dataset Schema & Specification')).toBeInTheDocument();
    });

    expect(screen.getByText('keyword')).toBeInTheDocument();
    expect(screen.getByText('location')).toBeInTheDocument();
    expect(screen.getByText('text')).toBeInTheDocument();
    expect(screen.getByText('target')).toBeInTheDocument();
  });

  it('renders professional empty state when dataset returns 503 unavailable', async () => {
    vi.spyOn(datasetApi, 'getDatasetSummary').mockRejectedValue({
      status: 503,
      code: 'DATASET_MISSING',
      message: 'Dataset file not found at data/raw/train.csv',
    });

    render(
      <MemoryRouter>
        <DatasetExplorer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dataset Not Available/i)).toBeInTheDocument();
      expect(screen.getAllByText(/data\/raw\/train\.csv/i)[0]).toBeInTheDocument();
    });

    // Should NOT fabricate any statistics or sample records
    expect(screen.queryByText(/Total Records: 7613/i)).not.toBeInTheDocument();
  });

  it('displays real EDA summary, distributions, and sample records when dataset is available', async () => {
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
      sample_records: [
        {
          id: '1',
          keyword: null,
          location: null,
          text: 'Our deeds are the reason of this #earthquake May ALLAH Forgive us all',
          target: 1,
        },
      ],
    });

    render(
      <MemoryRouter>
        <DatasetExplorer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('7,613')[0]).toBeInTheDocument();
      expect(screen.getAllByText('3,271')[0]).toBeInTheDocument();
      expect(screen.getAllByText('4,342')[0]).toBeInTheDocument();
      expect(screen.getByText('110')).toBeInTheDocument(); // duplicate records
    });

    // Data quality missing values table
    expect(screen.getByText('Data Quality & Missing Values')).toBeInTheDocument();
    expect(screen.getByText('2,533')).toBeInTheDocument(); // location missing count

    // Sample records table
    expect(screen.getByText('Sample Dataset Records')).toBeInTheDocument();
    expect(
      screen.getByText(/Our deeds are the reason of this #earthquake/i)
    ).toBeInTheDocument();
  });

  it('allows retrying fetch via refresh button', async () => {
    const getSummarySpy = vi.spyOn(datasetApi, 'getDatasetSummary')
      .mockRejectedValueOnce({ status: 503, message: 'Unavailable' })
      .mockResolvedValueOnce({
        status: 'available',
        total_records: 500,
        valid_records: 500,
        invalid_records: 0,
        duplicate_records: 5,
        columns: ['id', 'text', 'target'],
        class_distribution: { disaster: 200, non_disaster: 300 },
        class_percentages: { disaster: 40.0, non_disaster: 60.0 },
        missing_values: { id: 0, text: 0, target: 0 },
        sample_records: [],
      });

    render(
      <MemoryRouter>
        <DatasetExplorer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dataset Not Available/i)).toBeInTheDocument();
    });

    const refreshBtns = screen.getAllByRole('button', { name: /Refresh Dataset/i });
    fireEvent.click(refreshBtns[0]);

    await waitFor(() => {
      expect(getSummarySpy).toHaveBeenCalledTimes(2);
      expect(screen.getAllByText('500')[0]).toBeInTheDocument();
    });
  });
});
