import React, { useState, useEffect, useCallback } from 'react';
import { getModelStatus, trainModel, getModelComparison } from '../api/modelApi.js';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { LoadingIndicator } from '../components/common/LoadingIndicator.jsx';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { ConfusionMatrixTable } from '../components/common/ConfusionMatrixTable.jsx';

export function ModelComparison() {
  const [statusData, setStatusData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Training state
  const [isTraining, setIsTraining] = useState(false);
  const [trainError, setTrainError] = useState(null);
  const [trainSuccess, setTrainSuccess] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, compRes] = await Promise.all([
        getModelStatus().catch(() => null),
        getModelComparison().catch(() => null),
      ]);

      if (statusRes && statusRes.status === 'success') {
        setStatusData(statusRes.data);
        setIsTraining(statusRes.data?.isTraining || false);
      } else if (statusRes) {
        setStatusData(statusRes);
      }

      if (compRes) {
        setComparisonData(compRes.data || compRes);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch model information.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTrain = async () => {
    setTrainError(null);
    setTrainSuccess(null);
    setIsTraining(true);

    try {
      const res = await trainModel();
      setTrainSuccess(res.message || 'Model training completed successfully.');
      await fetchData();
    } catch (err) {
      setTrainError(err.message || 'Model training failed.');
    } finally {
      setIsTraining(false);
    }
  };

  const hasModelsTrained = comparisonData && Array.isArray(comparisonData.models) && comparisonData.models.length > 0;
  const isCurrentlyTraining = isTraining || statusData?.isTraining;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Model Comparison & Evaluation</h1>
          <p className="page-subtitle">
            Benchmark comparison across candidate classifiers evaluated on the stratified validation partition (15%).
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          style={{
            padding: '0.45rem 0.9rem',
            backgroundColor: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #e2e8f0)',
            borderRadius: 'var(--radius-md, 6px)',
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--color-text-main, #0f172a)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Refresh Status
        </button>
      </div>

      {loading && <LoadingIndicator message="Fetching model status and validation benchmarks..." />}
      {error && <ErrorMessage title="Failed to Load Model Data" message={error} onRetry={fetchData} />}

      {/* Model Training & Subsystem Status Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              Model Training & Lifecycle Controls
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Triggers the end-to-end ExperimentPipeline across Stratified Split, TF-IDF Vectorization, Chi-Square Selection, and Classifier Training.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTrain}
            disabled={isCurrentlyTraining}
            style={{
              padding: '0.6rem 1.4rem',
              backgroundColor: isCurrentlyTraining ? '#94a3b8' : 'var(--color-primary, #2563eb)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md, 6px)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: isCurrentlyTraining ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {isCurrentlyTraining ? (
              <>
                <span className="spinner-border" style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                Training in Progress...
              </>
            ) : (
              'Train Models'
            )}
          </button>
        </div>

        {/* Status Indicators Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.825rem' }}>
          <div style={{ padding: '0.6rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid var(--color-border, #e2e8f0)' }}>
            <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>Dataset Presence</span>
            <span style={{ fontWeight: 600, color: statusData?.datasetAvailable ? 'var(--color-success, #16a34a)' : 'var(--color-warning, #d97706)' }}>
              {statusData?.datasetAvailable ? 'Available: train.csv' : 'Dataset Missing (data/raw/train.csv)'}
            </span>
          </div>

          <div style={{ padding: '0.6rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid var(--color-border, #e2e8f0)' }}>
            <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>Loaded Model</span>
            <span style={{ fontWeight: 600, color: statusData?.modelLoaded ? 'var(--color-primary, #2563eb)' : 'var(--color-text-muted)' }}>
              {statusData?.modelLoaded ? statusData.selectedModel : 'No Model Loaded'}
            </span>
          </div>

          <div style={{ padding: '0.6rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid var(--color-border, #e2e8f0)' }}>
            <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>Training State</span>
            <span style={{ fontWeight: 600, color: isCurrentlyTraining ? '#0284c7' : 'var(--color-text-main)' }}>
              {isCurrentlyTraining ? 'Training in Progress' : (statusData?.trainingStatus || 'Idle')}
            </span>
          </div>

          <div style={{ padding: '0.6rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid var(--color-border, #e2e8f0)' }}>
            <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>Persisted Artifact</span>
            <span style={{ fontWeight: 600, color: statusData?.artifactAvailable ? 'var(--color-success, #16a34a)' : 'var(--color-text-muted)' }}>
              {statusData?.artifactAvailable ? 'Saved (artifacts/models/)' : 'No Artifact On Disk'}
            </span>
          </div>
        </div>

        {/* Training Alerts */}
        {trainSuccess && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', color: '#166534', fontSize: '0.85rem' }}>
            ✓ {trainSuccess}
          </div>
        )}
        {trainError && (
          <div style={{ marginTop: '1rem' }}>
            <ErrorMessage title="Training Failed or Unavailable" message={trainError} onRetry={handleTrain} />
          </div>
        )}
      </div>

      {/* Selected Best Model Banner (When Models are Trained) */}
      {hasModelsTrained && comparisonData.selectedModel && (
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md, 6px)',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1d4ed8' }}>
              Validation-Selected Winner
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e3a8a', marginTop: '0.2rem' }}>
              Selected Best Model: {comparisonData.selectedModel}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#1e40af', marginTop: '0.25rem' }}>
              Selected strictly on the held-out validation partition (15%) using Macro F1-score to maximize minority disaster class recall.
            </p>
          </div>
        </div>
      )}

      {/* Model Benchmark Comparison Table (When Trained) */}
      {hasModelsTrained ? (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-main)' }}>
            Validation Benchmark Results
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            All candidate models are evaluated on the exact same 15% stratified validation split:
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid var(--color-border, #e2e8f0)', textAlign: 'left' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Model</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Role</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Validation Accuracy</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Macro F1</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Weighted F1</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Macro Precision</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Macro Recall</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Log-Loss</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Brier Score</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.models.map((m, idx) => {
                  const isSelected = m.name === comparisonData.selectedModel;
                  const acc = m.metrics?.accuracy != null ? `${(m.metrics.accuracy * 100).toFixed(2)}%` : 'N/A';
                  const f1 = m.metrics?.macroF1 != null ? (m.metrics.macroF1).toFixed(4) : 'N/A';
                  const wf1 = m.metrics?.weightedF1 != null ? (m.metrics.weightedF1).toFixed(4) : 'N/A';
                  const prec = m.metrics?.classificationReport?.macroAvg?.precision != null
                    ? (m.metrics.classificationReport.macroAvg.precision).toFixed(4)
                    : 'N/A';
                  const rec = m.metrics?.classificationReport?.macroAvg?.recall != null
                    ? (m.metrics.classificationReport.macroAvg.recall).toFixed(4)
                    : 'N/A';
                  const logLoss = m.metrics?.logLoss != null ? (m.metrics.logLoss).toFixed(4) : '—';
                  const brier = m.metrics?.brierScore != null ? (m.metrics.brierScore).toFixed(4) : '—';

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid var(--color-border, #e2e8f0)',
                        backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {m.name}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        {m.isBaseline ? (
                          <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', backgroundColor: '#f1f5f9', borderRadius: '4px', color: '#475569' }}>
                            Baseline
                          </span>
                        ) : isSelected ? (
                          <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', backgroundColor: '#dcfce7', borderRadius: '4px', color: '#166534', fontWeight: 600 }}>
                            Winner ★
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', backgroundColor: '#f1f5f9', borderRadius: '4px', color: '#64748b' }}>
                            Candidate
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700 }}>{acc}</td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: isSelected ? '#15803d' : 'inherit' }}>{f1}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{wf1}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{prec}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{rec}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{logLoss}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{brier}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detailed Per-Model Confusion Matrices */}
          <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {comparisonData.models.map((m, idx) => (
              <div key={idx} style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--color-border, #e2e8f0)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{m.name}</h4>
                  {m.isBaseline && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Majority Baseline</span>}
                </div>
                <ConfusionMatrixTable matrix={m.metrics?.confusionMatrix} modelName={m.name} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State When No Models Trained */
        <div style={{ marginBottom: '1.5rem' }}>
          <EmptyState
            title="No Models Trained Yet"
            description="The experiment pipeline has not been executed yet because the raw dataset is absent. Once the dataset is loaded and training is triggered via POST /api/model/train, validation metrics, confusion matrices, and model comparison charts will appear here."
            icon="⚖️"
          />
        </div>
      )}

      {/* Educational Model Cards (Candidate Model Profiles) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
            DummyClassifier
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            Majority-Class Baseline
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', lineHeight: 1.5 }}>
            Predicts the dominant class from the training partition regardless of tweet content. Establishes the lower bound of performance.
          </p>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
            MultinomialNaiveBayes
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            Probabilistic Model (Laplace &alpha;=1.0)
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', lineHeight: 1.5 }}>
            Applies Bayes' theorem under feature conditional independence. Fast, effective baseline for word frequency and TF-IDF representations.
          </p>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
            LogisticRegression
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            Linear Classifier (L2 Regularized)
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', lineHeight: 1.5 }}>
            Trained via full-batch gradient descent minimizing binary cross-entropy loss with L2 regularization (&lambda; = 0.01).
          </p>
        </div>
      </div>

      {/* Syllabus Educational Methodology Section */}
      <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-main)' }}>
          Academic NLP Methodology &amp; Rigor
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>
              Why Validation F1 is Used for Model Selection
            </h4>
            <p>
              In disaster detection, non-disaster posts often outnumber real emergencies. Accuracy can be artificially inflated by predicting the majority class. Macro F1 computes the harmonic mean of precision and recall giving equal weight to disaster detection, making it the superior metric for choosing the winning model.
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>
              Test Set Partition Isolation
            </h4>
            <p>
              The 15% Test partition is never used to rank features or select models. Doing so would cause subtle data leakage and over-optimistic evaluation claims. The test set remains completely isolated until final bench testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
