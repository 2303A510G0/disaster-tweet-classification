import React from 'react';

export function LoadingIndicator({ message = 'Loading...', size = 'medium' }) {
  const sizeStyles = {
    small: { width: '16px', height: '16px', borderWidth: '2px' },
    medium: { width: '28px', height: '28px', borderWidth: '3px' },
    large: { width: '40px', height: '40px', borderWidth: '4px' },
  }[size] || { width: '28px', height: '28px', borderWidth: '3px' };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
          ...sizeStyles,
          borderRadius: '50%',
          borderColor: '#e2e8f0',
          borderTopColor: 'var(--color-primary, #2563eb)',
          borderStyle: 'solid',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {message && (
        <span style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '0.9rem' }}>
          {message}
        </span>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

