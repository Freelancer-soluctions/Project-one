import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import app from '../../../src/app.js';

const VERSION_FILE = path.resolve(process.cwd(), 'dist/version.json');

describe('GET /version (wiring)', () => {
  beforeAll(() => {
    try {
      fs.unlinkSync(VERSION_FILE);
    } catch {
      /* ignore */
    }
  });

  afterAll(() => {
    try {
      fs.unlinkSync(VERSION_FILE);
    } catch {
      /* ignore */
    }
  });

  it('responde 404 cuando version.json no existe (dev sin build)', async () => {
    const res = await request(app).get('/version');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('responde 200 con {revision, created} cuando version.json existe', async () => {
    const dir = path.dirname(VERSION_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      VERSION_FILE,
      JSON.stringify({ revision: 'abc123', created: '2026-11-19T00:00:00Z' })
    );

    const res = await request(app).get('/version');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      revision: 'abc123',
      created: '2026-11-19T00:00:00Z',
    });
  });
});
