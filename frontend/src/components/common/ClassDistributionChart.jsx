import React from 'react';

export function ClassDistributionChart({
  disasterCount = 0,
  nonDisasterCount = 0,
  disasterPct = 0,
  nonDisasterPct = 0,
  title = 'Class Distribution (Disaster vs Non-Disaster)',
}) {
  const total = disasterCount + nonDisasterCount;
  const dPct = total > 0 ? (disasterPct || ((disasterCount / total) * 100)).toFixed(2) : '0.00';
  const ndPct = total > 0 ? (nonDisasterPct || ((nonDisasterCount / total) * 100)).toFixed(2) : '0.00';

  return (
    <div
      role="region"
      aria-label={title}
      style={{
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: 'var(--radius-md, 6px)',
        padding: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '0.975rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{title}</h4>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          Total: <strong>{total.toLocaleString()}</strong> valid labels
        </span>
      </div>

      {/* Visual Proportional Horizontal Bar */}
      <div
        style={{
          height: '24px',
          width: '100%',
          backgroundColor: '#e2e8f0',
          borderRadius: '9999px',
          overflow: 'hidden',
          display: 'flex',
          marginBottom: '1.25rem',
        }}
      >
        <div
          title={`Disaster (Class 1): ${disasterCount} (${dPct}%)`}
          style={{
            width: `${dPct}%`,
            backgroundColor: '#dc2626', // Red for disaster
            transition: 'width 0.3s ease',
          }}
        />
        <div
          title={`Non-Disaster (Class 0): ${nonDisasterCount} (${ndPct}%)`}
          style={{
            width: `${ndPct}%`,
            backgroundColor: '#2563eb', // Blue for non-disaster
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Legend & Exact Numerical Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm, 4px)',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#991b1b' }}>Disaster (Class 1)</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#7f1d1d' }}>
            {disasterCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.785rem', color: '#b91c1c' }}>{dPct}% of valid records</div>
        </div>

        <div
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm, 4px)',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#1e40af' }}>Non-Disaster (Class 0)</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e3a8a' }}>
            {nonDisasterCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.785rem', color: '#1d4ed8' }}>{ndPct}% of valid records</div>
        </div>
      </div>
    </div>
  );
}
