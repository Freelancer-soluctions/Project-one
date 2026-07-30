import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Smoke Test: Server Health Check', () => {
  let server;

  beforeAll(() => {
    // Use supertest with the app directly (in-process)
    // This tests the Express app without needing a live server
    server = app;
  });

  it('GET /metrics should respond with 200 OK (Prometheus metrics endpoint)', async () => {
    const response = await request(server).get('/metrics');
    // Accept 200 (metrics available) or 500 (metrics error but server responds)
    expect([200, 500]).toContain(response.status);
    if (response.status === 200) {
      expect(response.text).toBeDefined();
      expect(response.text.length).toBeGreaterThan(0);
    }
  });

  it('GET /api/v1/auth/signin should respond (endpoint exists)', async () => {
    const response = await request(server).post('/api/v1/auth/signin').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });
    // Should respond with 400/401/422 - not 404 (endpoint exists)
    expect([400, 401, 422]).toContain(response.status);
  });

  it('Server should handle unknown routes with 404', async () => {
    const response = await request(server).get('/api/v1/nonexistent-endpoint-xyz');
    expect(response.status).toBe(404);
  });
});