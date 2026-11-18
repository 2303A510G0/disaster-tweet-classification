import React, { useState, useEffect } from 'react';
import { getModelStatus, predictTweet } from '../api/modelApi.js';
import { LoadingIndicator } from '../components/common/LoadingIndicator.jsx';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';

const EXAMPLE_TWEETS = [
  {
    label: 'Example 1: Disaster Report',
    text: 'Huge fire outbreak near downtown warehouse! Emergency crews dispatched #fire',
  },
  {
    label: 'Example 2: Metaphorical (Non-Disaster)',
    text: 'That new album was absolute fire, totally love the energy!',
  },
  {
    label: 'Example 3: Earthquake Alert',
    text: 'Earthquake tremors felt across the region, stay safe everyone',
  },
  {
    label: 'Example 4: Negation (Non-Disaster)',
    text: 'There is NO flood or crisis in our neighborhood today.',
  },
];

export function Prediction() {
  const [modelStatus, setModelStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [text, setText] = useState('');
  const [validationError, setValidationError] = useState('');
  const [predicting, setPredicting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);

  useEffect(() => {
    async function checkModel() {
      setLoadingStatus(true);
      try {
        const res = await getModelStatus();
        if (res && res.status === 'success') {
          setModelStatus(res.data);
        } else {
          setModelStatus(res);
        }
      } catch {
        setModelStatus({ modelLoaded: false, selectedModel: null });
      } finally {
        setLoadingStatus(false);
      }
    }
    checkModel();
  }, []);

  const handleSelectExample = (exampleText) => {
    setText(exampleText);
    setValidationError('');
    setApiError(null);
  };

  const handleClear = () => {
    setText('');
    setValidationError('');
    setApiError(null);
    setPredictionResult(null);
  };

  const handlePredict = async () => {
    setValidationError('');
    setApiError(null);

    const trimmed = text.trim();
    if (!trimmed) {
      setValidationError('Please enter tweet text to classify.');
      return;
    }

    if (trimmed.length > 5000) {
      setValidationError('Input text exceeds maximum allowed length of 5,000 characters.');
      return;
    }

    setPredicting(true);
    try {
      const res = await predictTweet(trimmed);
      if (res && res.data) {
        setPredictionResult(res.data);
      } else {
        setPredictionResult(res);
      }
    } catch (err) {
      setApiError(err.message || 'Prediction failed. Please try again.');
    } finally {
      setPredicting(false);
    }
  };

  const isModelAvailable = modelStatus?.modelLoaded;

  // Format probabilities
  const disasterProb = predictionResult?.probabilities?.disaster != null
    ? (predictionResult.probabilities.disaster * 100).toFixed(2)
    : '0.00';
  const notDisasterProb = predictionResult?.probabilities?.not_disaster != null
    ? (predictionResult.probabilities.not_disaster * 100).toFixed(2)
    : '0.00';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Tweet Classification Predictor</h1>
        <p className="page-subtitle">
          Real-time single-tweet inference using the selected best model and frozen NLP feature pipeline.
        </p>
      </div>

      {/* Model Loaded Status Banner */}
      {!loadingStatus && (
        <div style={{ marginBottom: '1.5rem' }}>
          {isModelAvailable ? (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-md, 6px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534' }}>
                  Model Ready: {modelStatus.selectedModel}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#15803d' }}>
                Frozen TF-IDF + Chi-Square In-Memory
              </span>
            </div>
          ) : (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 'var(--radius-md, 6px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e' }}>
                  No Trained Model Loaded
                </span>
              </div>
              <span style={{ fontSize: '0.785rem', color: '#b45309' }}>
                Visit Model Comparison to train or load an artifact
              </span>
            </div>
          )}
        </div>
      )}

      {/* Inference Pipeline Sequence Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: '0.4rem', color: 'var(--color-text-main)' }}>
          Inference Pipeline Sequence
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          1. <strong>Input Text Validation</strong> &rarr; 2. <strong>Regex Normalization</strong> (URLs, hashtags, handles, casing) &rarr;
          3. <strong>Tokenization &amp; Stemming</strong> &rarr; 4. <strong>TF-IDF Vectorization</strong> (frozen vocabulary &amp; IDF) &rarr;
          5. <strong>Chi-Square Feature Slicing</strong> &rarr; 6. <strong>Classifier Prediction</strong> &rarr; 7. <strong>Estimated Probability</strong>
        </p>
      </div>

      {/* Illustrative Example Chips */}
      <div style={{ marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          Illustrative Example Tweets (Click to Test):
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
          {EXAMPLE_TWEETS.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectExample(ex.text)}
              style={{
                backgroundColor: 'var(--color-surface, #ffffff)',
                border: '1px solid var(--color-border, #e2e8f0)',
                borderRadius: '9999px',
                padding: '0.3rem 0.75rem',
                fontSize: '0.8rem',
                color: 'var(--color-text-main, #0f172a)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prediction Input Form Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="tweet-prediction-input"
          style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}
        >
          Tweet Content
        </label>
        <textarea
          id="tweet-prediction-input"
          rows={4}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (validationError) setValidationError('');
          }}
          placeholder="Enter or paste a tweet to classify as disaster or non-disaster..."
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md, 6px)',
            border: validationError ? '1px solid var(--color-error, #dc2626)' : '1px solid var(--color-border, #e2e8f0)',
            fontSize: '0.925rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            lineHeight: 1.5,
          }}
        />

        {/* Counter & Validation Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.4rem',
            fontSize: '0.8rem',
          }}
        >
          <span style={{ color: text.length > 5000 ? 'var(--color-error, #dc2626)' : 'var(--color-text-muted)' }}>
            {text.length.toLocaleString()} / 5,000 characters
          </span>
          {validationError && (
            <span style={{ color: 'var(--color-error, #dc2626)', fontWeight: 500 }}>
              {validationError}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            type="button"
            onClick={handlePredict}
            disabled={predicting || text.length > 5000}
            style={{
              padding: '0.55rem 1.25rem',
              backgroundColor: 'var(--color-primary, #2563eb)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md, 6px)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: predicting || text.length > 5000 ? 'not-allowed' : 'pointer',
              opacity: predicting || text.length > 5000 ? 0.7 : 1,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {predicting ? 'Classifying...' : 'Predict Disaster Status'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: '0.55rem 1rem',
              backgroundColor: 'var(--color-surface, #ffffff)',
              color: 'var(--color-text-main, #0f172a)',
              border: '1px solid var(--color-border, #e2e8f0)',
              borderRadius: 'var(--radius-md, 6px)',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Clear / Reset
          </button>
        </div>
      </div>

      {predicting && <LoadingIndicator message="Running NLP inference pipeline..." />}
      {apiError && (
        <div style={{ marginBottom: '1.5rem' }}>
          <ErrorMessage title="Prediction Error" message={apiError} onRetry={handlePredict} />
        </div>
      )}

      {/* Prediction Result Display */}
      {predictionResult && (
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            borderLeft: predictionResult.prediction === 1 ? '5px solid #dc2626' : '5px solid #2563eb',
            backgroundColor: predictionResult.prediction === 1 ? '#fff5f5' : '#f0f9ff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: predictionResult.prediction === 1 ? '#991b1b' : '#1e40af' }}>
                Classification Outcome
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: predictionResult.prediction === 1 ? '#991b1b' : '#1e3a8a', marginTop: '0.1rem' }}>
                {predictionResult.prediction === 1 ? '🚨 Real Disaster Report' : '🟢 Not a Disaster Report'}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: predictionResult.prediction === 1 ? '#fecaca' : '#bfdbfe',
                  color: predictionResult.prediction === 1 ? '#991b1b' : '#1e40af',
                }}
              >
                Class {predictionResult.prediction}
              </span>
              {predictionResult.model_name && (
                <span
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--color-border, #e2e8f0)',
                    color: 'var(--color-text-main, #0f172a)',
                  }}
                >
                  Model: {predictionResult.model_name}
                </span>
              )}
            </div>
          </div>

          {/* Model-Estimated Probabilities Bar */}
          <div style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              <span style={{ color: '#dc2626' }}>Disaster: {disasterProb}%</span>
              <span style={{ color: '#2563eb' }}>Non-Disaster: {notDisasterProb}%</span>
            </div>

            {/* Proportional Confidence Bar */}
            <div
              style={{
                height: '14px',
                width: '100%',
                backgroundColor: '#e2e8f0',
                borderRadius: '9999px',
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <div
                title={`Disaster: ${disasterProb}%`}
                style={{
                  width: `${disasterProb}%`,
                  backgroundColor: '#dc2626',
                  transition: 'width 0.3s ease',
                }}
              />
              <div
                title={`Non-Disaster: ${notDisasterProb}%`}
                style={{
                  width: `${notDisasterProb}%`,
                  backgroundColor: '#2563eb',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#334155', fontStyle: 'italic', marginBottom: '0.5rem' }}>
            &quot;{predictionResult.text}&quot;
          </div>
        </div>
      )}

      {/* Mandatory Academic Disclaimer */}
      <div
        style={{
          padding: '0.85rem 1rem',
          backgroundColor: '#f8fafc',
          border: '1px solid var(--color-border, #e2e8f0)',
          borderRadius: 'var(--radius-md, 6px)',
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)',
          lineHeight: 1.5,
        }}
      >
        <strong>Academic Disclaimer:</strong> Predictions are model estimates, not verified facts. Performance depends on the training dataset, preprocessing configuration, and model quality. Always consult verified emergency broadcasting services during real natural hazards.
      </div>
    </div>
  );
}
