/**
 * useModelStatus.js — Hook for Fetching and Managing Model Subsystem Status (T14)
 */

import { useState, useEffect, useCallback } from 'react';
import { getModelStatus } from '../api/modelApi.js';

export function useModelStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getModelStatus();
      if (response && response.status === 'success') {
        setData(response.data);
      } else {
        setData(response);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch model status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    data,
    loading,
    error,
    refresh: fetchStatus,
  };
}
