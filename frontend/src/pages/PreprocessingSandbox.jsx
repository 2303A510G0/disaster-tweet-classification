import React, { useState } from 'react';
import { preprocessText } from '../api/preprocessApi.js';
import { LoadingIndicator } from '../components/common/LoadingIndicator.jsx';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';

const EXAMPLE_TWEETS = [
  {
    label: 'Example 1: Disaster Report',
    text: 'Our deeds are the reason of this #earthquake May ALLAH Forgive us all',
  },
  {
    label: 'Example 2: Metaphorical Negation',
    text: 'There is NO disaster here, not even a minor incident!',
  },
  {
    label: 'Example 3: Web Noise & Mentions',
    text: 'Forest fire near La Ronge Sask. Canada http://t.co/fire @EmergencyAlerts',
  },
];

const NEGATION_WORDS = new Set([
  'no', 'not', 'never', 'none', 'nobody', 'nothing', 'neither', 'nowhere',
  'hardly', 'scarcely', 'barely', 'without', 'cannot', 'cant', 'wont',
  'dont', 'isnt', 'arent', 'wasnt', 'werent', 'hasnt', 'havent', 'hadnt',
  'couldnt', 'shouldnt', 'wouldnt',
]);

export function PreprocessingSandbox() {
  const [text, setText] = useState('');
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const [options, setOptions] = useState({
    lowercase: true,
    removeUrls: true,
    removeHtml: true,
    handleMentions: true,
    handleHashtags: true,
    removeStopWords: true,
    preserveNegation: true,
    stemming: true,
  });

  const handleOptionChange = (key) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectExample = (exampleText) => {
    setText(exampleText);
    setValidationError('');
    setApiError(null);
  };

  const handleClear = () => {
    setText('');
    setValidationError('');
    setApiError(null);
    setResult(null);
    setOptions({
      lowercase: true,
      removeUrls: true,
      removeHtml: true,
      handleMentions: true,
      handleHashtags: true,
      removeStopWords: true,
      preserveNegation: true,
      stemming: true,
    });
  };

  const handleProcess = async () => {
    setValidationError('');
    setApiError(null);

    const trimmed = text.trim();
    if (!trimmed) {
      setValidationError('Please enter tweet text to preprocess.');
      return;
    }

    if (trimmed.length > 2000) {
      setValidationError('Tweet text exceeds maximum limit of 2,000 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await preprocessText(trimmed, options);
      setResult(data);
    } catch (err) {
      setApiError(err.message || 'Failed to process tweet text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFinal = () => {
    if (result?.final_text) {
      navigator.clipboard?.writeText(result.final_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">NLP Preprocessing Sandbox</h1>
        <p className="page-subtitle">
          Interactive workbench demonstrating sequential text cleaning, normalization, tokenization, stop-word removal with negation retention, and Porter stemming.
        </p>
      </div>

      {/* Illustrative Example Chips */}
      <div style={{ marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          Illustrative Examples (Click to Load):
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

      {/* Input Textarea Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="raw-tweet-input"
          style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}
        >
          Raw Tweet Text
        </label>
        <textarea
          id="raw-tweet-input"
          rows={4}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (validationError) setValidationError('');
          }}
          placeholder="Enter or paste a raw tweet to inspect its transformation stages..."
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
          <span style={{ color: text.length > 2000 ? 'var(--color-error, #dc2626)' : 'var(--color-text-muted)' }}>
            {text.length.toLocaleString()} / 2,000 characters
          </span>
          {validationError && (
            <span style={{ color: 'var(--color-error, #dc2626)', fontWeight: 500 }}>
              {validationError}
            </span>
          )}
        </div>

        {/* Preprocessing Options Accordion / Checkboxes */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--color-border, #e2e8f0)',
          }}
        >
          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-main)', display: 'block', marginBottom: '0.5rem' }}>
            Pipeline Transformation Options:
          </span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.6rem',
              fontSize: '0.825rem',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={options.lowercase}
                onChange={() => handleOptionChange('lowercase')}
              />
              Lowercase Text
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={options.removeUrls}
                onChange={() => handleOptionChange('removeUrls')}
              />
              Remove URLs (http/https)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={options.removeHtml}
                onChange={() => handleOptionChange('removeHtml')}
              />
              Strip HTML Entities
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={options.handleMentions}
                onChange={() => handleOptionChange('handleMentions')}
              />
              Strip @Mentions
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={options.handleHashtags}
                onChange={() => handleOptionChange('handleHashtags')}
              />
              Preserve #Hashtag Words
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={options.removeStopWords}
                onChange={() => handleOptionChange('removeStopWords')}
              />
              Filter Stop Words
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={options.preserveNegation}
                onChange={() => handleOptionChange('preserveNegation')}
              />
              Preserve Negation (no/not)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={options.stemming}
                onChange={() => handleOptionChange('stemming')}
              />
              Porter Stemming
            </label>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            type="button"
            onClick={handleProcess}
            disabled={loading || text.length > 2000}
            style={{
              padding: '0.55rem 1.25rem',
              backgroundColor: 'var(--color-primary, #2563eb)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md, 6px)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: loading || text.length > 2000 ? 'not-allowed' : 'pointer',
              opacity: loading || text.length > 2000 ? 0.7 : 1,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {loading ? 'Processing...' : 'Process Tweet'}
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

      {/* Loading & API Error States */}
      {loading && <LoadingIndicator message="Executing JavaScript NLP preprocessing pipeline..." />}
      {apiError && (
        <div style={{ marginBottom: '1.5rem' }}>
          <ErrorMessage title="Preprocessing Error" message={apiError} onRetry={handleProcess} />
        </div>
      )}

      {/* Educational Callout: Stemming vs Lemmatization */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: 'var(--radius-md, 6px)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.4rem' }}>
          💡 Stemming vs. Lemmatization in Pure JavaScript NLP
        </h4>
        <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
          <p style={{ marginBottom: '0.4rem' }}>
            <strong>Porter Stemming:</strong> Employs canonical Martin Porter (1980) algorithmic suffix-stripping rules (e.g. <em>evacuation</em> &rarr; <code>evacu</code>, <em>running</em> &rarr; <code>run</code>, <em>deeds</em> &rarr; <code>deed</code>). It is computationally lightweight, deterministic, and executes in pure JavaScript without external dictionary databases. Stemmed outputs are morphological roots rather than guaranteed dictionary words.
          </p>
          <p style={{ marginBottom: '0.4rem' }}>
            <strong>Lemmatization (WordNet):</strong> Requires large lexical databases and Part-of-Speech tagging to map inflected forms back to valid dictionary lemmas. In accordance with instructor guidance, pure JavaScript implementations avoid external Python subprocesses.
          </p>
          <p>
            <strong>Negation Preservation:</strong> Standard English stop-word lists filter words like <code>not</code>, <code>no</code>, <code>never</code>, and <code>without</code>. In disaster classification, removing negations causes disastrous semantic inversions (e.g. <em>"There is NO fire here"</em> &rarr; <em>"fire"</em>). Our pipeline explicitly retains negation modifiers.
          </p>
        </div>
      </div>

      {/* Structured Output Stages (Rendered upon processing) */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
            Sequential Preprocessing Stages
          </h3>

          {/* Stage 1: Original Raw Text */}
          <div className="card">
            <span style={{ fontSize: '0.785rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Stage 1: Original Raw Text
            </span>
            <div style={{ marginTop: '0.35rem', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
              {result.original_text}
            </div>
          </div>

          {/* Stage 2: Normalized & Cleaned Text */}
          <div className="card">
            <span style={{ fontSize: '0.785rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Stage 2: Normalized & Cleaned Text (Lowercased, URLs & Mentions Stripped, Punctuation Normalized)
            </span>
            <div style={{ marginTop: '0.35rem', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
              {result.cleaned_text || '(Empty string after cleaning)'}
            </div>
          </div>

          {/* Stage 3: Word Tokens */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.785rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                Stage 3: Word Tokens ({result.tokens?.length || 0} tokens extracted)
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
              {result.tokens?.map((token, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '0.2rem 0.5rem',
                    fontFamily: 'monospace',
                    fontSize: '0.825rem',
                    color: '#0f172a',
                  }}
                >
                  {token}
                </span>
              ))}
            </div>
          </div>

          {/* Stage 4: Stop-Word Filtered Tokens */}
          <div className="card">
            <span style={{ fontSize: '0.785rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Stage 4: Stop-Word Filtered Tokens ({result.filtered_tokens?.length || 0} tokens retained)
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
              {result.filtered_tokens?.map((token, idx) => {
                const isNegation = NEGATION_WORDS.has(token.toLowerCase());
                return (
                  <span
                    key={idx}
                    title={isNegation ? 'Retained Negation Modifier' : 'Content Token'}
                    style={{
                      backgroundColor: isNegation ? '#fef3c7' : '#f1f5f9',
                      border: isNegation ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                      borderRadius: '4px',
                      padding: '0.2rem 0.5rem',
                      fontFamily: 'monospace',
                      fontSize: '0.825rem',
                      color: isNegation ? '#92400e' : '#0f172a',
                      fontWeight: isNegation ? 700 : 400,
                    }}
                  >
                    {token} {isNegation ? '★' : ''}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Stage 5: Porter Stemmed Tokens */}
          <div className="card">
            <span style={{ fontSize: '0.785rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Stage 5: Porter Stemmed Tokens ({result.stemmed_tokens?.length || 0} root stems)
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
              {result.stemmed_tokens?.map((stem, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: '#e0f2fe',
                    border: '1px solid #7dd3fc',
                    borderRadius: '4px',
                    padding: '0.2rem 0.5rem',
                    fontFamily: 'monospace',
                    fontSize: '0.825rem',
                    color: '#0369a1',
                  }}
                >
                  {stem}
                </span>
              ))}
            </div>
          </div>

          {/* Stage 6: Final Processed String */}
          <div className="card" style={{ borderLeft: '4px solid var(--color-primary, #2563eb)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.785rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                Stage 6: Final Processed String (Ready for Vectorization & Feature Extraction)
              </span>
              <button
                type="button"
                onClick={handleCopyFinal}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  backgroundColor: 'var(--color-surface, #ffffff)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: 'var(--color-text-main, #0f172a)',
                }}
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.6rem 0.8rem',
                backgroundColor: '#f8fafc',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.925rem',
                color: '#1e293b',
                fontWeight: 600,
              }}
            >
              {result.final_text || '(Empty sequence)'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
