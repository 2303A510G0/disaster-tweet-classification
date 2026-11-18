import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('GET /api/health', () => {
  it('returns 200 OK with application health metadata matching contract', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({
      status: 'ok',
      app_name: 'Syllabus NLP Disaster Tweets API',
      version: '1.0.0',
    });
  });

  it('returns 404 for unknown endpoints with structured error message', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('detail');
    expect(typeof res.body.detail).toBe('string');
  });
});

