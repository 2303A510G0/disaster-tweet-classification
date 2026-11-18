import React from 'react';

export function StatusBadge({ status, label, children }) {
  const normalizedStatus = (status || '').toLowerCase();

  let styles = {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderColor: '#cbd5e1',
  };

  if (normalizedStatus === 'connected' || normalizedStatus === 'trained' || normalizedStatus === 'success') {
    styles = {
      backgroundColor: 'var(--color-success-bg, #f0fdf4)',
      color: 'var(--color-success, #16a34a)',
      borderColor: 'var(--color-success-border, #bbf7d0)',
    };
  } else if (normalizedStatus === 'checking' || normalizedStatus === 'training' || normalizedStatus === 'warning') {
    styles = {
      backgroundColor: 'var(--color-warning-bg, #fffbeb)',
      color: 'var(--color-warning, #d97706)',
      borderColor: 'var(--color-warning-border, #fde68a)',
    };
  } else if (normalizedStatus === 'disconnected' || normalizedStatus === 'error' || normalizedStatus === 'failed') {
    styles = {
      backgroundColor: 'var(--color-danger-bg, #fef2f2)',
      color: 'var(--color-danger, #dc2626)',
      borderColor: 'var(--color-danger-border, #fecaca)',
    };
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '9999px',
        fontSize: '0.785rem',
        fontWeight: 600,
        border: `1px solid ${styles.borderColor}`,
        backgroundColor: styles.backgroundColor,
        color: styles.color,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: styles.color,
        }}
      />
      {label || children || status}
    </span>
  );
}

