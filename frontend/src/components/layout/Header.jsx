import React from 'react';
import { StatusBadge } from '../common/StatusBadge.jsx';

export function Header({ isConnected, isChecking, error, onRefresh, onToggleMobileNav }) {
  const getStatusProps = () => {
    if (isChecking) {
      return { status: 'checking', label: 'Checking Backend...' };
    }
    if (isConnected) {
      return { status: 'connected', label: 'Backend Connected' };
    }
    return { status: 'disconnected', label: 'Backend Offline' };
  };

  const statusProps = getStatusProps();

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="mobile-toggle-btn"
          onClick={onToggleMobileNav}
          aria-label="Toggle Navigation Menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          Disaster Tweets Classification System
        </span>
      </div>

      <div className="header-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StatusBadge status={statusProps.status} label={statusProps.label} />
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh backend status"
              disabled={isChecking}
              aria-label="Refresh backend status"
              style={{
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  animation: isChecking ? 'spin 1s linear infinite' : 'none',
                }}
              >
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

