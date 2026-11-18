/**
 * navigation.test.jsx — Unit & Integration Tests for Navigation and Layout (T13)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { Header } from '../components/layout/Header.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';

describe('Navigation and Layout Unit Tests', () => {
  it('renders all six primary navigation links in the sidebar', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar isOpen={true} onCloseMobileNav={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Dataset Explorer')).toBeInTheDocument();
    expect(screen.getByText('Preprocessing Sandbox')).toBeInTheDocument();
    expect(screen.getByText('Feature Extraction')).toBeInTheDocument();
    expect(screen.getByText('Model Comparison')).toBeInTheDocument();
    expect(screen.getByText('Tweet Prediction')).toBeInTheDocument();
  });

  it('marks active navigation item based on current route', () => {
    render(
      <MemoryRouter initialEntries={['/dataset']}>
        <Sidebar isOpen={true} onCloseMobileNav={() => {}} />
      </MemoryRouter>
    );

    const datasetLink = screen.getByText('Dataset Explorer').closest('a');
    expect(datasetLink).toHaveClass('active');

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).not.toHaveClass('active');
  });

  it('renders backend status connected when online', () => {
    render(
      <Header
        isConnected={true}
        isChecking={false}
        error={null}
        onRefresh={() => {}}
        onToggleMobileNav={() => {}}
      />
    );

    expect(screen.getByText('Backend Connected')).toBeInTheDocument();
  });

  it('renders backend status offline when unreachable', () => {
    render(
      <Header
        isConnected={false}
        isChecking={false}
        error="Connection refused"
        onRefresh={() => {}}
        onToggleMobileNav={() => {}}
      />
    );

    expect(screen.getByText('Backend Offline')).toBeInTheDocument();
  });

  it('renders checking status while connecting', () => {
    render(
      <Header
        isConnected={false}
        isChecking={true}
        error={null}
        onRefresh={() => {}}
        onToggleMobileNav={() => {}}
      />
    );

    expect(screen.getByText('Checking Backend...')).toBeInTheDocument();
  });

  it('fires mobile navigation toggle when hamburger button is clicked', () => {
    const handleToggle = vi.fn();
    render(
      <Header
        isConnected={true}
        isChecking={false}
        error={null}
        onRefresh={() => {}}
        onToggleMobileNav={handleToggle}
      />
    );

    const toggleBtn = screen.getByLabelText('Toggle Navigation Menu');
    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });
});

