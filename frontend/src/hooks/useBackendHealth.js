/**
 * useBackendHealth.js — Hook for Monitoring Backend Connection State
 */

import { useState, useEffect, useCallback } from 'react';
import { checkHealth } from '../api/healthApi.js';

export function useBackendHealth(pollIntervalMs = 30000) {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [serverInfo, setServerInfo] = useState(null);
  const [error, setError] = useState(null);

  const verifyHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const data = await checkHealth();
      if (data && (data.status === 'ok' || data.status === 'healthy')) {
        setIsConnected(true);
        setServerInfo(data);
        setError(null);
      } else {
        setIsConnected(false);
        setError('Backend returned non-ok health status.');
      }
    } catch (err) {
      setIsConnected(false);
      setError(err.message || 'Cannot reach backend service.');
    } finally {
      setIsChecking(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    verifyHealth();

    if (pollIntervalMs > 0) {
      const interval = setInterval(verifyHealth, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [verifyHealth, pollIntervalMs]);

  return {
    isConnected,
    isChecking,
    lastChecked,
    serverInfo,
    error,
    refresh: verifyHealth,
  };
}

