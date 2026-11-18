/**
 * apiClient.test.js — Unit Tests for Centralized API Client (T13)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiRequest, get, post, ApiError } from '../api/apiClient.js';

describe('apiClient Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('performs successful GET request and parses JSON', async () => {
    const mockData = { status: 'ok', app_name: 'Test' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockData,
    });

    const result = await get('/health');
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/health'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('performs successful POST request with JSON payload', async () => {
    const mockResponse = { status: 'success', data: { prediction: 1 } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse,
    });

    const result = await post('/model/predict', { text: 'Earthquake' });
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/model/predict'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'Earthquake' }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
  });

  it('throws ApiError with status and message on HTTP failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        status: 'error',
        code: 'DATASET_MISSING',
        detail: 'Dataset file not found at data/raw/train.csv',
      }),
    });

    await expect(get('/dataset/summary')).rejects.toThrow(ApiError);

    try {
      await get('/dataset/summary');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(503);
      expect(err.code).toBe('DATASET_MISSING');
      expect(err.message).toMatch(/Dataset file not found/);
    }
  });

  it('throws ApiError with status 0 on network/connection failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    try {
      await get('/health');
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(0);
      expect(err.code).toBe('NETWORK_ERROR');
      expect(err.message).toMatch(/Network error/);
    }
  });
});

