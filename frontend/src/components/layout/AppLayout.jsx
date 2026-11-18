import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Header } from './Header.jsx';
import { useBackendHealth } from '../../hooks/useBackendHealth.js';

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { isConnected, isChecking, error, refresh } = useBackendHealth();

  const handleToggleMobileNav = () => setMobileNavOpen((prev) => !prev);
  const handleCloseMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={mobileNavOpen} onCloseMobileNav={handleCloseMobileNav} />

      <div
        className={`sidebar-backdrop ${mobileNavOpen ? 'open' : ''}`}
        onClick={handleCloseMobileNav}
        aria-hidden="true"
      />

      <div className="app-main">
        <Header
          isConnected={isConnected}
          isChecking={isChecking}
          error={error}
          onRefresh={refresh}
          onToggleMobileNav={handleToggleMobileNav}
        />

        <main className="content-area">
          <Outlet context={{ isConnected, isChecking, refreshHealth: refresh }} />
        </main>
      </div>
    </div>
  );
}

