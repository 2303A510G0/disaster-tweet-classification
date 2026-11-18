/**
 * App.test.jsx — Route Rendering & Integration Tests (T13)
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { Dashboard } from '../pages/Dashboard.jsx';
import { DatasetExplorer } from '../pages/DatasetExplorer.jsx';
import { PreprocessingSandbox } from '../pages/PreprocessingSandbox.jsx';
import { FeatureExtractionExplorer } from '../pages/FeatureExtractionExplorer.jsx';
import { ModelComparison } from '../pages/ModelComparison.jsx';
import { Prediction } from '../pages/Prediction.jsx';
import { NotFound } from '../pages/NotFound.jsx';

// Mock useBackendHealth hook to avoid un-awaited asynchronous state updates during mount
vi.mock('../hooks/useBackendHealth.js', () => ({
  useBackendHealth: () => ({
    isConnected: true,
    isChecking: false,
    lastChecked: new Date(),
    serverInfo: { status: 'ok' },
    error: null,
    refresh: vi.fn(),
  }),
}));

function renderWithRouter(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dataset" element={<DatasetExplorer />} />
          <Route path="preprocess" element={<PreprocessingSandbox />} />
          <Route path="features" element={<FeatureExtractionExplorer />} />
          <Route path="models" element={<ModelComparison />} />
          <Route path="predict" element={<Prediction />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('App Route Integration Tests', () => {
  it('renders Dashboard page on root / route', async () => {
    renderWithRouter('/');
    await waitFor(() => {
      expect(screen.getByText('Disaster Tweets Classification Platform')).toBeInTheDocument();
      expect(screen.getByText('Project Pipeline Architecture')).toBeInTheDocument();
    });
  });

  it('renders DatasetExplorer page on /dataset route', async () => {
    renderWithRouter('/dataset');
    await waitFor(() => {
      expect(screen.getByText('Dataset Explorer & EDA')).toBeInTheDocument();
      expect(screen.getByText('Dataset Schema & Specification')).toBeInTheDocument();
    });
  });

  it('renders PreprocessingSandbox page on /preprocess route', async () => {
    renderWithRouter('/preprocess');
    await waitFor(() => {
      expect(screen.getByText('NLP Preprocessing Sandbox')).toBeInTheDocument();
      expect(screen.getByText(/Stemming vs\. Lemmatization/i)).toBeInTheDocument();
    });
  });

  it('renders FeatureExtractionExplorer page on /features route', async () => {
    renderWithRouter('/features');
    await waitFor(() => {
      expect(screen.getByText('Feature Extraction & Selection Explorer')).toBeInTheDocument();
      expect(screen.getByText(/Dataset-Trained Features Status/i)).toBeInTheDocument();
    });
  });

  it('renders ModelComparison page on /models route', async () => {
    renderWithRouter('/models');
    await waitFor(() => {
      expect(screen.getByText('Model Comparison & Evaluation')).toBeInTheDocument();
      expect(screen.getByText('No Models Trained Yet')).toBeInTheDocument();
    });
  });

  it('renders Prediction page on /predict route', async () => {
    renderWithRouter('/predict');
    await waitFor(() => {
      expect(screen.getByText('Tweet Classification Predictor')).toBeInTheDocument();
      expect(screen.getByText('Inference Pipeline Sequence')).toBeInTheDocument();
    });
  });

  it('renders NotFound page on invalid unknown route', () => {
    renderWithRouter('/some/nonexistent/path');
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByText('Return to Dashboard')).toBeInTheDocument();
  });
});
