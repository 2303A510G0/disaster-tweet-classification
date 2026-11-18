import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('POST /api/preprocess', () => {
  it('returns 200 OK with complete structured preprocessing results for valid tweet', async () => {
    const payload = {
      text: 'BREAKING! Flood rescue needed NOW! https://example.com #FloodRescue @user',
      options: {
        removeStopWords: true,
        stemming: true,
      },
    };

    const res = await request(app)
      .post('/api/preprocess')
      .send(payload)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('original_text', payload.text);
    expect(res.body).toHaveProperty('cleaned_text');
    expect(res.body).toHaveProperty('tokens');
    expect(res.body).toHaveProperty('filtered_tokens');
    expect(res.body).toHaveProperty('stemmed_tokens');
    expect(res.body).toHaveProperty('final_text');
    expect(res.body).toHaveProperty('options');
    expect(Array.isArray(res.body.tokens)).toBe(true);
    expect(Array.isArray(res.body.filtered_tokens)).toBe(true);
    expect(Array.isArray(res.body.stemmed_tokens)).toBe(true);
    expect(res.body.tokens).toContain('flood');
    expect(res.body.options.removeStopWords).toBe(true);
  });

  it('returns 422 when text field is missing or empty', async () => {
    const resEmpty = await request(app)
      .post('/api/preprocess')
      .send({ text: '' });

    expect(resEmpty.status).toBe(422);
    expect(resEmpty.body).toHaveProperty('detail');

    const resMissing = await request(app)
      .post('/api/preprocess')
      .send({});

    expect(resMissing.status).toBe(422);
    expect(resMissing.body).toHaveProperty('detail');
  });

  it('returns 422 when text is not a string', async () => {
    const res = await request(app)
      .post('/api/preprocess')
      .send({ text: 12345 });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('detail');
  });

  it('returns 422 when text exceeds maximum character length (2000 chars)', async () => {
    const longText = 'a'.repeat(2001);
    const res = await request(app)
      .post('/api/preprocess')
      .send({ text: longText });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('detail');
  });
});

