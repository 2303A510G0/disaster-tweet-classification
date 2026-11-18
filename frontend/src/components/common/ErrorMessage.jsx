import React from 'react';

export function ErrorMessage({ title = 'Error', message, onRetry }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      style={{
        backgroundColor: 'var(--color-danger-bg, #fef2f2)',
        border: '1px solid var(--color-danger-border, #fecaca)',
        borderRadius: 'var(--radius-md, 6px)',
        padding: '1rem 1.25rem',
        color: 'var(--color-danger, #dc2626)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong style={{ fontSize: '0.95rem' }}>{title}</strong>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              fontSize: '0.85rem',
              color: 'var(--color-danger, #dc2626)',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        )}
      </div>
      <p style={{ margin: 0, fontSize: '0.9rem', color: '#7f1d1d' }}>{message}</p>
    </div>
  );
}

