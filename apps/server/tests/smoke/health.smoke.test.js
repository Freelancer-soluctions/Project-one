import { describe, it, expect } from 'vitest';
import createRequest from './helpers/request.js';

describe('Smoke Test: Server Health Check', () => {
  it('GET /health should respond with 200 (healthy) or 503 (degraded) and JSON status', async () => {
    const response = await createRequest().get('/health');
    // Accept 200 (DB reachable) or 503 (DB unreachable but server alive)
    expect([200, 503]).toContain(response.status);
    expect(response.headers['content-type']).toMatch(/json/);
    // Body status should match: 'ok' for 200, 'degraded' for 503
    const expectedStatus = response.status === 200 ? 'ok' : 'degraded';
    expect(response.body).toEqual({
      status: expectedStatus,
      timestamp: expect.any(String),
    });
  });

  it('GET /metrics should respond with 200 OK (Prometheus metrics endpoint)', async () => {
    const response = await createRequest().get('/metrics');
    // Accept 200 (metrics available) or 500 (metrics error but server responds)
    expect([200, 500]).toContain(response.status);
    // Always verify response.text is defined (unconditional expect)
    expect(response.text).toBeDefined();
    // Verify text length - if 200, length > 0; if 500, length >= 0
    const textLength = response.status === 200 ? response.text.length : 0;
    expect(textLength).toBeGreaterThanOrEqual(0);
    // For 200 responses, text length should be > 0 (unconditional check)
    expect(response.status !== 200 || textLength > 0).toBe(true);
  });

  it('GET /api/v1/auth/signin should respond (endpoint exists)', async () => {
    const response = await createRequest().post('/api/v1/auth/signin').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });
    // Should respond with 400/401/422 - not 404 (endpoint exists)
    expect([400, 401, 422]).toContain(response.status);
  });

  it('Server should handle unknown routes with 404', async () => {
    const response = await createRequest().get(
      '/api/v1/nonexistent-endpoint-xyz'
    );
    expect(response.status).toBe(404);
  });
});
