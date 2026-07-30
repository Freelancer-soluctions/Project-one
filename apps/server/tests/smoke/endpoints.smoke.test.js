import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Smoke Test: Critical API Endpoints', () => {
  // These endpoints require authentication, so we expect 401/403 without a token
  // The important thing is they respond (not 404, not 500) - meaning the route is registered and server is up
  
  const criticalEndpoints = [
    { path: '/api/v1/users', method: 'get' },
    { path: '/api/v1/products', method: 'get' },
    { path: '/api/v1/sales', method: 'get' },
  ];

  describe.each(criticalEndpoints)('$method $path', ({ path, method }) => {
    it(`should respond with valid HTTP status (not 404, not 500)`, async () => {
      const response = await request(app)[method](path);
      
      // Valid responses: 200 (OK), 401 (Unauthorized), 403 (Forbidden), 422 (Validation)
      // Invalid responses: 404 (Not Found - route missing), 500 (Server Error)
      expect([200, 401, 403, 422]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  // Test that at least 3 critical endpoints are responsive
  it('at least 3 critical API endpoints should respond successfully', async () => {
    let successCount = 0;
    
    for (const { path, method } of criticalEndpoints) {
      try {
        const response = await request(app)[method](path);
        if ([200, 401, 403, 422].includes(response.status)) {
          successCount++;
        }
      } catch (error) {
        // Network error or timeout - count as failure
      }
    }
    
    expect(successCount).toBeGreaterThanOrEqual(3);
  });

  // Additional critical endpoints that should exist
  describe('Additional critical endpoints', () => {
    it('GET /api/v1/clients should respond', async () => {
      const response = await request(app).get('/api/v1/clients');
      expect([200, 401, 403, 422]).toContain(response.status);
    });

    it('GET /api/v1/warehouse should respond', async () => {
      const response = await request(app).get('/api/v1/warehouse');
      expect([200, 401, 403, 422]).toContain(response.status);
    });

    it('GET /api/v1/employees should respond', async () => {
      const response = await request(app).get('/api/v1/employees');
      expect([200, 401, 403, 422]).toContain(response.status);
    });
  });
});