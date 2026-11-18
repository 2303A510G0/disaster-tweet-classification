import { describe, it, expect } from 'vitest';
import { config } from '../../src/config/index.js';

describe('Backend Configuration', () => {
  it('has valid default application name and version matching contract', () => {
    expect(config.APP_NAME).toBe('Syllabus NLP Disaster Tweets API');
    expect(config.VERSION).toBe('1.0.0');
    expect(config.PORT).toBeDefined();
    expect(Array.isArray(config.CORS_ORIGINS)).toBe(true);
  });
});

