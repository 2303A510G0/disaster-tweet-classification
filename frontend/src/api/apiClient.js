/**
 * apiClient.js — Centralized HTTP Client for Backend Communication (T13)
 *
 * Configurable via VITE_API_BASE_URL environment variable.
 * Default fallback is '/api' (handled by Vite proxy in dev or reverse proxy in prod).
 */

const BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api';

/**
 * Custom error class wrapping API failures.
 */
export class ApiError extends Error {
  constructor(message, status, code = null, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Generic request helper with robust error and network failure handling.
 *
 * @param {string} endpoint - API path relative to BASE_URL (e.g. '/health')
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiRequest(endpoint, options = {}) {
  // Normalize leading slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL.replace(/\/$/, '')}${cleanEndpoint}`;

  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    // Network failure (server down, CORS blocked, unreachable)
    throw new ApiError(
      `Network error: unable to connect to backend server at ${url}. ${err.message}`,
      0,
      'NETWORK_ERROR'
    );
  }

  let data;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      (typeof data === 'object' && data !== null && (data.message || data.detail)) ||
      `HTTP Error ${response.status}: ${response.statusText}`;

    const errorCode = (typeof data === 'object' && data !== null && data.code) || null;

    throw new ApiError(errorMsg, response.status, errorCode, data);
  }

  return data;
}

/**
 * Performs a GET request.
 */
export function get(endpoint, headers = {}) {
  return apiRequest(endpoint, { method: 'GET', headers });
}

/**
 * Performs a POST request with JSON payload.
 */
export function post(endpoint, body = {}, headers = {}) {
  return apiRequest(endpoint, { method: 'POST', body, headers });
}

