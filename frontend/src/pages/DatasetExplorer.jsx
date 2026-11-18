import React from 'react';
import { useDatasetSummary } from '../hooks/useDatasetSummary.js';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { LoadingIndicator } from '../components/common/LoadingIndicator.jsx';
import { ErrorMessage } from '../components/common/ErrorMessage.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { ClassDistributionChart } from '../components/common/ClassDistributionChart.jsx';

export function DatasetExplorer() {
  const { data, loading, error, isUnavailable, refresh } = useDatasetSummary();

  const isDatasetAvailable = !isUnavailable && data && data.status === 'available';

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Dataset Explorer & EDA</h1>
          <p className="page-subtitle">
            Exploratory analysis, class distribution, and data quality inspection of the Kaggle Disaster Tweets dataset.
          </p>
        </div>
        <button
          onClick={refresh}
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
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Refresh Dataset
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && <LoadingIndicator message="Fetching dataset summary from backend..." />}
      {error && !isUnavailable && (
        <div style={{ marginBottom: '1.5rem' }}>
          <ErrorMessage title="Failed to Load Dataset Summary" message={error} onRetry={refresh} />
        </div>
      )}

      {/* Dataset Summary Cards (When Available) */}
      {isDatasetAvailable && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div className="card">
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Total Records</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '0.2rem' }}>
              {data.total_records.toLocaleString()}
            </div>
            <p style={{ fontSize: '0.785rem', color: 'var(--color-text-light)' }}>
              File: {data.filename}
            </p>
          </div>

          <div className="card">
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Valid Records</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success, #16a34a)', marginTop: '0.2rem' }}>
              {data.valid_records.toLocaleString()}
            </div>
            <p style={{ fontSize: '0.785rem', color: 'var(--color-text-light)' }}>
              Non-empty text & valid 0/1 target
            </p>
          </div>

          <div className="card">
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Duplicate Records</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: data.duplicate_records > 0 ? 'var(--color-warning, #d97706)' : 'var(--color-text-main)', marginTop: '0.2rem' }}>
              {data.duplicate_records.toLocaleString()}
            </div>
            <p style={{ fontSize: '0.785rem', color: 'var(--color-text-light)' }}>
              Identical text & label pairs
            </p>
          </div>

          <div className="card">
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Columns Verified</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '0.2rem' }}>
              {data.columns?.length || 5}
            </div>
            <p style={{ fontSize: '0.785rem', color: 'var(--color-text-light)' }}>
              {data.columns ? data.columns.join(', ') : 'id, keyword, location, text, target'}
            </p>
          </div>
        </div>
      )}

      {/* Class Distribution Section */}
      {isDatasetAvailable ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <ClassDistributionChart
            disasterCount={data.class_distribution.disaster}
            nonDisasterCount={data.class_distribution.non_disaster}
            disasterPct={data.class_percentages.disaster}
            nonDisasterPct={data.class_percentages.non_disaster}
            title="Class Distribution (Binary Target)"
          />
        </div>
      ) : isUnavailable ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <EmptyState
            title="Dataset Not Available"
            description="The Kaggle train.csv file has not yet been added to data/raw/train.csv. Dataset exploratory metrics, class distribution charts, and data quality diagnostics will appear here once the original dataset file is supplied."
            actionText="Refresh Dataset"
            onAction={refresh}
            icon="📂"
          />
        </div>
      ) : null}

      {/* Data Quality & Missing Values (When Available) */}
      {isDatasetAvailable && data.missing_values && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Data Quality & Missing Values
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Column Name</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Missing Count</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Missing Percentage</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Handling Strategy</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.missing_values).map(([col, count]) => {
                  const pct = ((count / data.total_records) * 100).toFixed(2);
                  return (
                    <tr key={col} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.5rem 0.75rem' }}><code>{col}</code></td>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: count > 0 ? 600 : 400, color: count > 0 ? '#b91c1c' : 'inherit' }}>
                        {count.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{pct}%</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)' }}>
                        {col === 'text'
                          ? 'Critical: Records with empty text are dropped.'
                          : col === 'target'
                          ? 'Critical: Records with missing/invalid target are dropped.'
                          : 'Optional metadata: Skipped in NLP classification model pipeline.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sample Records Table (When Available) */}
      {isDatasetAvailable && data.sample_records && data.sample_records.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Sample Dataset Records
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem 0.75rem', width: '60px' }}>ID</th>
                  <th style={{ padding: '0.5rem 0.75rem', width: '120px' }}>Keyword</th>
                  <th style={{ padding: '0.5rem 0.75rem', width: '120px' }}>Location</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Tweet Text</th>
                  <th style={{ padding: '0.5rem 0.75rem', width: '100px' }}>Target</th>
                </tr>
              </thead>
              <tbody>
                {data.sample_records.map((rec) => (
                  <tr key={rec.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.5rem 0.75rem' }}><code>{rec.id}</code></td>
                    <td style={{ padding: '0.5rem 0.75rem', color: rec.keyword ? 'inherit' : 'var(--color-text-light)' }}>
                      {rec.keyword || '—'}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: rec.location ? 'inherit' : 'var(--color-text-light)' }}>
                      {rec.location || '—'}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{rec.text}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <StatusBadge
                        status={rec.target === 1 ? 'error' : 'connected'}
                        label={rec.target === 1 ? '1: Disaster' : '0: Not Disaster'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dataset Schema Section (Always visible) */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Dataset Schema & Specification
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Expected file location: <code>data/raw/train.csv</code> (RFC 4180 CSV standard). Below is the confirmed field mapping for this classification task:
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.75rem' }}>Column Name</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Data Type</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Description</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Role in Pipeline</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.5rem 0.75rem' }}><code>id</code></td>
                <td style={{ padding: '0.5rem 0.75rem' }}>Integer</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>Unique tweet identifier</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>Record tracking / key</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.5rem 0.75rem' }}><code>keyword</code></td>
                <td style={{ padding: '0.5rem 0.75rem' }}>String (Optional)</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>A specific disaster keyword (e.g. "evacuation", "fire")</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>Metadata (contains missing values)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.5rem 0.75rem' }}><code>location</code></td>
                <td style={{ padding: '0.5rem 0.75rem' }}>String (Optional)</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>User-provided geographic location (frequently noisy/missing)</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>Metadata (~33% missing)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.5rem 0.75rem' }}><code>text</code></td>
                <td style={{ padding: '0.5rem 0.75rem' }}>String</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>The raw tweet content containing vocabulary, hashtags, and links</td>
                <td style={{ padding: '0.5rem 0.75rem' }}><strong>Primary Input Feature</strong></td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem 0.75rem' }}><code>target</code></td>
                <td style={{ padding: '0.5rem 0.75rem' }}>Binary (0 or 1)</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <strong>0</strong> = Non-disaster post, <strong>1</strong> = Real disaster report
                </td>
                <td style={{ padding: '0.5rem 0.75rem' }}><strong>Binary Target Label</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
