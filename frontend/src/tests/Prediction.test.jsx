/**
 * Prediction.test.jsx — Unit & Integration Tests for Tweet Prediction Page (T16)
 *
 * Follows strict TDD (RED phase before component implementation).
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Prediction } from '../pages/Prediction.jsx';
import * as modelApi from '../api/modelApi.js';

describe('Prediction Page Component Tests (T16)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockLoadedModelStatus = {
    datasetAvailable: true,
    trainingStatus: 'trained',
    isTraining: false,
    modelLoaded: true,
    selectedModel: 'MultinomialNaiveBayes',
    artifactAvailable: true,
  };

  const mockNotLoadedStatus = {
    datasetAvailable: false,
    trainingStatus: 'idle',
    isTraining: false,
    modelLoaded: false,
    selectedModel: null,
    artifactAvailable: false,
  };

  it('renders page header, input textarea, character counter, examples, and predict button', async () => {
    vi.spyOn(modelApi, 'getModelStatus').mockResolvedValue({
      status: 'success',
      data: mockLoadedModelStatus,
    });

    render(
      <MemoryRouter>
        <Prediction />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tweet Classification Predictor')).toBeInTheDocument();
      expect(screen.getByText(/Model Ready: MultinomialNaiveBayes/i)).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/Enter or paste a tweet to classify/i)).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 5,000 characters/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Predict Disaster Status/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear \/ Reset/i })).toBeInTheDocument();

    // Disclaimer check
    expect(screen.getByText(/Predictions are model estimates, not verified facts/i)).toBeInTheDocument();
  });

  it('displays model-not-loaded warning banner when backend has no active model', async () => {
    vi.spyOn(modelApi, 'getModelStatus').mockResolvedValue({
      status: 'success',
      data: mockNotLoadedStatus,
    });

    render(
      <MemoryRouter>
        <Prediction />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No Trained Model Loaded/i)).toBeInTheDocument();
    });
  });

  it('populates textarea and updates character counter when clicking an illustrative example', async () => {
    vi.spyOn(modelApi, 'getModelStatus').mockResolvedValue({
      status: 'success',
      data: mockLoadedModelStatus,
    });

    render(
      <MemoryRouter>
        <Prediction />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tweet Classification Predictor')).toBeInTheDocument();
    });

    const exampleBtn = screen.getByText(/Example 1: Disaster Report/i);
    fireEvent.click(exampleBtn);

    const textarea = screen.getByPlaceholderText(/Enter or paste a tweet to classify/i);
    expect(textarea.value.length).toBeGreaterThan(0);
    expect(screen.getByText(new RegExp(`${textarea.value.length} \\/ 5,000 characters`, 'i'))).toBeInTheDocument();
  });

  it('shows client validation error when clicking Predict with empty input', async () => {
    vi.spyOn(modelApi, 'getModelStatus').mockResolvedValue({
      status: 'success',
      data: mockLoadedModelStatus,
    });
    const predictSpy = vi.spyOn(modelApi, 'predictTweet');

    render(
      <MemoryRouter>
        <Prediction />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tweet Classification Predictor')).toBeInTheDocument();
    });

    const predictBtn = screen.getByRole('button', { name: /Predict Disaster Status/i });
    fireEvent.click(predictBtn);

    expect(screen.getByText(/Please enter tweet text to classify/i)).toBeInTheDocument();
    expect(predictSpy).not.toHaveBeenCalled();
  });

  it('successfully predicts Disaster (Class 1) and displays probabilities and model badge', async () => {
    vi.spyOn(modelApi, 'getModelStatus').mockResolvedValue({
      status: 'success',
      data: mockLoadedModelStatus,
    });

    const mockPrediction = {
      status: 'success',
      data: {
        text: 'Forest fire expanding rapidly near residential buildings',
        prediction: 1,
        label: 'Disaster',
        probabilities: {
          disaster: 0.8845,
          not_disaster: 0.1155,
        },
        model_name: 'MultinomialNaiveBayes',
      },
    };

    vi.spyOn(modelApi, 'predictTweet').mockResolvedValue(mockPrediction);

    render(
      <MemoryRouter>
        <Prediction />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Enter or paste a tweet to classify/i);
    fireEvent.change(textarea, { target: { value: 'Forest fire expanding rapidly near residential buildings' } });

    const predictBtn = screen.getByRole('button', { name: /Predict Disaster Status/i });
    fireEvent.click(predictBtn);

    await waitFor(() => {
      expect(screen.getByText(/Real Disaster Report/i)).toBeInTheDocument();
      expect(screen.getByText(/Class 1/i)).toBeInTheDocument();
      expect(screen.getAllByText(/MultinomialNaiveBayes/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/88\.45%/)).toBeInTheDocument();
      expect(screen.getByText(/11\.55%/)).toBeInTheDocument();
    });
  });

  it('successfully predicts Non-Disaster (Class 0)', async () => {
    vi.spyOn(modelApi, 'getModelStatus').mockResolvedValue({
      status: 'success',
      data: mockLoadedModelStatus,
    });

    const mockPrediction = {
      status: 'success',
      data: {
        text: 'That party was pure fire, loved the music!',
        prediction: 0,
        label: 'Not Disaster',
        probabilities: {
          disaster: 0.0825,
          not_disaster: 0.9175,
        },
        model_name: 'LogisticRegression',
      },
    };

    vi.spyOn(modelApi, 'predictTweet').mockResolvedValue(mockPrediction);

    render(
      <MemoryRouter>
        <Prediction />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Enter or paste a tweet to classify/i);
    fireEvent.change(textarea, { target: { value: 'That party was pure fire, loved the music!' } });

    const predictBtn = screen.getByRole('button', { name: /Predict Disaster Status/i });
    fireEvent.click(predictBtn);

    await waitFor(() => {
      expect(screen.getByText(/Not a Disaster Report/i)).toBeInTheDocument();
      expect(screen.getByText(/Class 0/i)).toBeInTheDocument();
      expect(screen.getByText(/91\.75%/)).toBeInTheDocument();
    });
  });

  it('clears input and prediction output when Clear / Reset button is clicked', async () => {
    vi.spyOn(modelApi, 'getModelStatus').mockResolvedValue({
      status: 'success',
      data: mockLoadedModelStatus,
    });

    render(
      <MemoryRouter>
        <Prediction />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tweet Classification Predictor')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Enter or paste a tweet to classify/i);
    fireEvent.change(textarea, { target: { value: 'Testing tweet text' } });
    expect(textarea.value).toBe('Testing tweet text');

    const clearBtn = screen.getByRole('button', { name: /Clear \/ Reset/i });
    fireEvent.click(clearBtn);

    expect(textarea.value).toBe('');
    expect(screen.getByText(/0 \/ 5,000 characters/i)).toBeInTheDocument();
  });

  it('displays helpful error message when backend returns 503 NO_MODEL_LOADED', async () => {
    vi.spyOn(modelApi, 'getModelStatus').mockResolvedValue({
      status: 'success',
      data: mockLoadedModelStatus,
    });

    vi.spyOn(modelApi, 'predictTweet').mockRejectedValue({
      status: 503,
      code: 'NO_MODEL_LOADED',
      message: 'No trained model is currently loaded. Please train or load a model first.',
    });

    render(
      <MemoryRouter>
        <Prediction />
      </MemoryRouter>
    );

    const textarea = screen.getByPlaceholderText(/Enter or paste a tweet to classify/i);
    fireEvent.change(textarea, { target: { value: 'Earthquake alert' } });

    const predictBtn = screen.getByRole('button', { name: /Predict Disaster Status/i });
    fireEvent.click(predictBtn);

    await waitFor(() => {
      expect(screen.getByText(/No trained model is currently loaded/i)).toBeInTheDocument();
    });
  });
});
