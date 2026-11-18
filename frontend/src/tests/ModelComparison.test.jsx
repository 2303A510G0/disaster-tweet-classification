/**
 * ModelComparison.test.jsx — Unit & Integration Tests for Model Training & Comparison Page (T16)
 *
 * Follows strict TDD (RED phase before component implementation).
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ModelComparison } from '../pages/ModelComparison.jsx';
import * as modelApi from '../api/modelApi.js';

describe('ModelComparison Page Component Tests (T16)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockNotTrainedStatus = {
    datasetAvailable: false,
    trainingStatus: 'idle',
    isTraining: false,
    modelLoaded: false,
    selectedModel: null,
    artifactAvailable: false,
  };

  const mockNotTrainedComparison = {
    status: 'not_trained',
    message: 'No models have been trained or loaded yet.',
    data: {
      models: [],
      selectedModel: null,
      bestMetadata: null,
    },
  };

  const mockTrainedStatus = {
    datasetAvailable: true,
    trainingStatus: 'trained',
    isTraining: false,
    modelLoaded: true,
    selectedModel: 'MultinomialNaiveBayes',
    artifactAvailable: true,
  };

  const mockTrainedComparison = {
    status: 'success',
    data: {
      selectedModel: 'MultinomialNaiveBayes',
      models: [
        {
          name: 'DummyClassifier',
          metrics: {
            accuracy: 0.5703,
            macroF1: 0.3632,
            weightedF1: 0.4137,
            confusionMatrix: [[570, 0], [430, 0]],
            classificationReport: {
              0: { precision: 0.57, recall: 1.0, f1: 0.72, support: 570 },
              1: { precision: 0.0, recall: 0.0, f1: 0.0, support: 430 },
              macroAvg: { precision: 0.285, recall: 0.5, f1: 0.363 },
              weightedAvg: { precision: 0.325, recall: 0.57, f1: 0.413 },
            },
            logLoss: null,
            brierScore: null,
          },
          isBaseline: true,
        },
        {
          name: 'MultinomialNaiveBayes',
          metrics: {
            accuracy: 0.7986,
            macroF1: 0.7915,
            weightedF1: 0.7972,
            confusionMatrix: [[490, 80], [150, 280]],
            classificationReport: {
              0: { precision: 0.76, recall: 0.86, f1: 0.81, support: 570 },
              1: { precision: 0.78, recall: 0.65, f1: 0.71, support: 430 },
              macroAvg: { precision: 0.77, recall: 0.755, f1: 0.7915 },
              weightedAvg: { precision: 0.77, recall: 0.77, f1: 0.7972 },
            },
            logLoss: 0.4521,
            brierScore: 0.1412,
          },
          isBaseline: false,
        },
        {
          name: 'LogisticRegression',
          metrics: {
            accuracy: 0.7912,
            macroF1: 0.7854,
            weightedF1: 0.7901,
            confusionMatrix: [[485, 85], [154, 276]],
            classificationReport: {
              0: { precision: 0.76, recall: 0.85, f1: 0.80, support: 570 },
              1: { precision: 0.76, recall: 0.64, f1: 0.70, support: 430 },
              macroAvg: { precision: 0.76, recall: 0.745, f1: 0.7854 },
              weightedAvg: { precision: 0.76, recall: 0.76, f1: 0.7901 },
            },
            logLoss: 0.4688,
            brierScore: 0.1495,
          },
          isBaseline: false,
        },
      ],
    },
  };

  it('renders model status cards, empty comparison state, and training controls when no models trained', async () => {
    vi.spyOn(modelApi, 'getModelStatus').mockResolvedValue({
      status: 'success',
      data: mockNotTrainedStatus,
    });
    vi.spyOn(modelApi, 'getModelComparison').mockResolvedValue(mockNotTrainedComparison);

    render(
      <MemoryRouter>
        <ModelComparison />
      </MemoryRouter>
    );

    expect(screen.getByText('Model Comparison & Evaluation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Train Models/i })).toBeInTheDocument();

    await waitFor(() => {
      // Model status indications
      expect(screen.getByText(/Dataset Missing/i)).toBeInTheDocument();
      expect(screen.getByText(/No Model Loaded/i)).toBeInTheDocument();
      expect(screen.getByText(/No Models Trained Yet/i)).toBeInTheDocument();
    });

    // Educational model explanations
    expect(screen.getByText('DummyClassifier')).toBeInTheDocument();
    expect(screen.getByText('MultinomialNaiveBayes')).toBeInTheDocument();
    expect(screen.getByText('LogisticRegression')).toBeInTheDocument();
  });

  it('shows error guidance when user clicks Train Models with dataset missing', async () => {
    vi.spyOn(modelApi, 'getModelStatus').mockResolvedValue({
      status: 'success',
      data: mockNotTrainedStatus,
    });
    vi.spyOn(modelApi, 'getModelComparison').mockResolvedValue(mockNotTrainedComparison);

    const trainSpy = vi.spyOn(modelApi, 'trainModel').mockRejectedValue({
      status: 503,
      code: 'DATASET_MISSING',
      message: 'Dataset file not found at data/raw/train.csv. Please place the Kaggle dataset before initiating training.',
    });

    render(
      <MemoryRouter>
        <ModelComparison />
      </MemoryRouter>
    );

    const trainBtn = screen.getByRole('button', { name: /Train Models/i });
    fireEvent.click(trainBtn);

    await waitFor(() => {
      expect(trainSpy).toHaveBeenCalled();
      expect(screen.getByText(/Dataset file not found at data\/raw\/train\.csv/i)).toBeInTheDocument();
    });
  });

  it('renders benchmark comparison table, confusion matrix, and winning model badge when trained', async () => {
    vi.spyOn(modelApi, 'getModelStatus').mockResolvedValue({
      status: 'success',
      data: mockTrainedStatus,
    });
    vi.spyOn(modelApi, 'getModelComparison').mockResolvedValue(mockTrainedComparison);

    render(
      <MemoryRouter>
        <ModelComparison />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Selected Best Model: MultinomialNaiveBayes/i)).toBeInTheDocument();
      // Table headers
      expect(screen.getByText('Validation Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Macro F1')).toBeInTheDocument();
    });

    // Numerical scores in comparison table
    expect(screen.getByText('79.86%')).toBeInTheDocument(); // Naive Bayes accuracy
    expect(screen.getByText('79.12%')).toBeInTheDocument(); // Logistic Regression accuracy
    expect(screen.getByText('57.03%')).toBeInTheDocument(); // Dummy accuracy

    // Confusion Matrix visualization headers
    expect(screen.getAllByText(/Confusion Matrix/i).length).toBeGreaterThanOrEqual(1);

    // Syllabus educational methodology
    expect(screen.getByText(/Why Validation F1 is Used for Model Selection/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Set Partition Isolation/i)).toBeInTheDocument();
  });

  it('disables train button while training is actively running', async () => {
    vi.spyOn(modelApi, 'getModelStatus').mockResolvedValue({
      status: 'success',
      data: {
        ...mockNotTrainedStatus,
        isTraining: true,
        trainingStatus: 'training',
      },
    });
    vi.spyOn(modelApi, 'getModelComparison').mockResolvedValue(mockNotTrainedComparison);

    render(
      <MemoryRouter>
        <ModelComparison />
      </MemoryRouter>
    );

    await waitFor(() => {
      const trainBtn = screen.getByRole('button', { name: /Training in Progress/i });
      expect(trainBtn).toBeDisabled();
    });
  });
});
