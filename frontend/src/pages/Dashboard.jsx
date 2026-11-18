import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useDatasetSummary } from '../hooks/useDatasetSummary.js';
import { useModelStatus } from '../hooks/useModelStatus.js';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { ClassDistributionChart } from '../components/common/ClassDistributionChart.jsx';
import { PipelineFlow } from '../components/common/PipelineFlow.jsx';

export function Dashboard() {
  const { isConnected, isChecking, refreshHealth } = useOutletContext() || {};
  const {
    data: datasetData,
    loading: datasetLoading,
    isUnavailable: datasetUnavailable,
    refresh: refreshDataset,
  } = useDatasetSummary();

  const {
    data: modelData,
    loading: modelLoading,
    refresh: refreshModel,
  } = useModelStatus();

  const handleRefreshAll = () => {
    if (refreshHealth) refreshHealth();
    refreshDataset();
    refreshModel();
  };

  const isDatasetPresent = !datasetUnavailable && datasetData && datasetData.status === 'available';

  return (
    <div>
      {/* Top Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Disaster Tweets Classification Platform</h1>
          <p className="page-subtitle">
            End-to-end academic Natural Language Processing platform implemented in pure JavaScript.
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
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
          Refresh Status
        </button>
      </div>

      {/* Overview KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Card 1: Backend Connection */}
        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            API Gateway
          </span>
          <div style={{ marginTop: '0.4rem', marginBottom: '0.4rem' }}>
            <StatusBadge
              status={isChecking ? 'checking' : isConnected ? 'connected' : 'disconnected'}
              label={isChecking ? 'Checking...' : isConnected ? 'API Online' : 'API Offline'}
            />
          </div>
          <p style={{ fontSize: '0.785rem', color: 'var(--color-text-light)' }}>
            Express backend port 5000
          </p>
        </div>

        {/* Card 2: Dataset Availability */}
        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Dataset Availability
          </span>
          <div style={{ marginTop: '0.4rem', marginBottom: '0.4rem' }}>
            {datasetLoading ? (
              <StatusBadge status="checking" label="Checking..." />
            ) : isDatasetPresent ? (
              <StatusBadge status="connected" label="Loaded: train.csv" />
            ) : (
              <StatusBadge status="warning" label="File Missing: data/raw/train.csv" />
            )}
          </div>
          <p style={{ fontSize: '0.785rem', color: 'var(--color-text-light)' }}>
            {isDatasetPresent ? datasetData.filename : 'Kaggle dataset expected'}
          </p>
        </div>

        {/* Card 3: Total Records */}
        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Total Records
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '0.2rem' }}>
            {datasetLoading
              ? '...'
              : isDatasetPresent
              ? (datasetData.total_records || 0).toLocaleString()
              : 'No dataset loaded'}
          </div>
          <p style={{ fontSize: '0.785rem', color: 'var(--color-text-light)' }}>
            {isDatasetPresent
              ? `${(datasetData.valid_records || datasetData.total_records || 0).toLocaleString()} valid`
              : 'Real dataset required'}
          </p>
        </div>

        {/* Card 4: Disaster Records */}
        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Disaster (Class 1)
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: isDatasetPresent ? '#991b1b' : 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            {datasetLoading
              ? '...'
              : isDatasetPresent && datasetData.class_distribution
              ? (datasetData.class_distribution.disaster || 0).toLocaleString()
              : 'Unavailable'}
          </div>
          <p style={{ fontSize: '0.785rem', color: 'var(--color-text-light)' }}>
            {isDatasetPresent && datasetData.class_percentages
              ? `${datasetData.class_percentages.disaster}% of labels`
              : 'Requires train.csv'}
          </p>
        </div>

        {/* Card 5: Non-Disaster Records */}
        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Non-Disaster (Class 0)
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: isDatasetPresent ? '#1e40af' : 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            {datasetLoading
              ? '...'
              : isDatasetPresent && datasetData.class_distribution
              ? (datasetData.class_distribution.non_disaster || 0).toLocaleString()
              : 'Unavailable'}
          </div>
          <p style={{ fontSize: '0.785rem', color: 'var(--color-text-light)' }}>
            {isDatasetPresent && datasetData.class_percentages
              ? `${datasetData.class_percentages.non_disaster}% of labels`
              : 'Requires train.csv'}
          </p>
        </div>

        {/* Card 6: Selected Model */}
        <div className="card">
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Active Model
          </span>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-main)', marginTop: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {modelLoading
              ? '...'
              : modelData && modelData.selectedModel
              ? modelData.selectedModel
              : 'None Loaded'}
          </div>
          <p style={{ fontSize: '0.785rem', color: 'var(--color-text-light)' }}>
            {modelData && modelData.modelLoaded ? 'Ready for live inference' : 'Awaiting training'}
          </p>
        </div>
      </div>

      {/* System Status Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-main)' }}>
          System Operational Diagnostics
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Backend Server: </span>
            <strong>{isConnected ? 'Online (HTTP 200)' : 'Offline / Unreachable'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Dataset Status: </span>
            <strong>{isDatasetPresent ? 'Available (Loaded)' : 'Missing (data/raw/train.csv)'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Training Lifecycle: </span>
            <strong>{modelData?.trainingStatus || 'idle'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Disk Artifact: </span>
            <strong>{modelData?.artifactAvailable ? 'Present on disk' : 'None persisted'}</strong>
          </div>
        </div>
      </div>

      {/* Dataset Distribution Visualization */}
      <div style={{ marginBottom: '1.5rem' }}>
        {isDatasetPresent ? (
          <ClassDistributionChart
            disasterCount={datasetData.class_distribution.disaster}
            nonDisasterCount={datasetData.class_distribution.non_disaster}
            disasterPct={datasetData.class_percentages.disaster}
            nonDisasterPct={datasetData.class_percentages.non_disaster}
            title="Class Distribution (Kaggle Dataset)"
          />
        ) : (
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem' }}>Class Distribution</h3>
            <EmptyState
              title="Class Distribution Data Unavailable"
              description="The dataset file data/raw/train.csv is currently missing. Real class breakdown, percentages, and exploratory charts will appear here once the Kaggle dataset is added."
              icon="📊"
            />
          </div>
        )}
      </div>

      {/* Pipeline Architecture Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Project Pipeline Architecture
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          End-to-end NLP data flow from raw CSV ingestion to live inference, enforcing strict train/val/test isolation:
        </p>
        <PipelineFlow />
      </div>

      {/* Quick Navigation Action Cards */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>Next Actions</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Navigate to dedicated views to inspect dataset columns, compare evaluation metrics, or test predictions:
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to="/dataset"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-surface-hover, #f1f5f9)',
              borderRadius: 'var(--radius-md, 6px)',
              border: '1px solid var(--color-border, #e2e8f0)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-text-main, #0f172a)',
            }}
          >
            Explore Dataset &rarr;
          </Link>
          <Link
            to="/preprocess"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-surface-hover, #f1f5f9)',
              borderRadius: 'var(--radius-md, 6px)',
              border: '1px solid var(--color-border, #e2e8f0)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-text-main, #0f172a)',
            }}
          >
            Preprocessing Sandbox &rarr;
          </Link>
          <Link
            to="/features"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-surface-hover, #f1f5f9)',
              borderRadius: 'var(--radius-md, 6px)',
              border: '1px solid var(--color-border, #e2e8f0)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-text-main, #0f172a)',
            }}
          >
            Feature Extraction &rarr;
          </Link>
          <Link
            to="/models"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-surface-hover, #f1f5f9)',
              borderRadius: 'var(--radius-md, 6px)',
              border: '1px solid var(--color-border, #e2e8f0)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-text-main, #0f172a)',
            }}
          >
            Model Comparison &rarr;
          </Link>
          <Link
            to="/predict"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-primary, #2563eb)',
              borderRadius: 'var(--radius-md, 6px)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#ffffff',
            }}
          >
            Predict Tweet &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
