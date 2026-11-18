import React from 'react';

export function EmptyState({ title, description, actionText, onAction, icon }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 1.5rem',
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px dashed var(--color-border, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 8px)',
      }}
    >
      {icon && <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#94a3b8' }}>{icon}</div>}
      <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-main, #0f172a)', marginBottom: '0.5rem' }}>
        {title}
      </h3>
      {description && (
        <p
          style={{
            color: 'var(--color-text-muted, #64748b)',
            fontSize: '0.925rem',
            maxWidth: '520px',
            marginBottom: actionText ? '1.25rem' : 0,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          style={{
            backgroundColor: 'var(--color-primary, #2563eb)',
            color: '#ffffff',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md, 6px)',
            fontWeight: 500,
            fontSize: '0.9rem',
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

