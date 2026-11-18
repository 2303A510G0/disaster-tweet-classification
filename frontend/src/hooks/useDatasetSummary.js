/**
 * useDatasetSummary.js — Hook for Fetching and Managing Dataset Summary State (T14)
 */

import { useState, useEffect, useCallback } from 'react';
import { getDatasetSummary } from '../api/datasetApi.js';

export function useDatasetSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUnavailable, setIsUnavailable] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsUnavailable(false);

    try {
      const summary = await getDatasetSummary();
      setData(summary);
      setIsUnavailable(false);
    } catch (err) {
      if (err.status === 503 || err.code === 'DATASET_MISSING') {
        setIsUnavailable(true);
        setData(null);
      } else {
        setError(err.message || 'Failed to fetch dataset summary.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    data,
    loading,
    error,
    isUnavailable,
    refresh: fetchSummary,
  };
}
