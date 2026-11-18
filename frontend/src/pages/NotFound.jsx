import React from 'react';
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '4rem 1.5rem',
      }}
    >
      <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-primary, #2563eb)', marginBottom: '0.5rem' }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--color-text-main, #0f172a)' }}>
        Page Not Found
      </h2>
      <p style={{ color: 'var(--color-text-muted, #64748b)', maxWidth: '420px', marginBottom: '1.5rem' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        style={{
          backgroundColor: 'var(--color-primary, #2563eb)',
          color: '#ffffff',
          padding: '0.5rem 1.25rem',
          borderRadius: 'var(--radius-md, 6px)',
          fontWeight: 500,
          textDecoration: 'none',
        }}
      >
        Return to Dashboard
      </Link>
    </div>
  );
}

