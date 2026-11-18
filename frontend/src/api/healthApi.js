/**
 * healthApi.js — Backend Health Endpoint Client
 */

import { get } from './apiClient.js';

export async function checkHealth() {
  return get('/health');
}

