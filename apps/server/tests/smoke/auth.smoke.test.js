import { describe, it, expect } from 'vitest';
import createRequest from './helpers/request.js';

describe('Smoke Test: Authentication Endpoint', () => {
  // Test credentials - in CI/CD these should be provided via environment variables
  // or a test user should be seeded in the database
  const testEmail = process.env.SMOKE_TEST_EMAIL;
  const testPassword = process.env.SMOKE_TEST_PASSWORD;

  // Test 1: Login endpoint exists and responds
  it('POST /api/v1/auth/signin should respond (endpoint exists and handles request)', async () => {
    const response = await createRequest()
      .post('/api/v1/auth/signin')
      .send({
        email: testEmail || 'nonexistent@test.com',
        password: testPassword || 'wrongpassword',
      });

    // Should get a valid HTTP response - not 404, not 500
    expect([200, 201, 400, 401, 422]).toContain(response.status);
    expect(response.body).toBeDefined();
  });

  // Test 2: If valid credentials provided, should return token
  it.skipIf(!testEmail || !testPassword)(
    'POST /api/v1/auth/signin should return token with valid credentials',
    async () => {
      const response = await createRequest()
        .post('/api/v1/auth/signin')
        .send({ email: testEmail, password: testPassword })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
    }
  );

  // Test 3: Signup endpoint exists
  it('POST /api/v1/auth/signup should respond (endpoint exists)', async () => {
    const response = await createRequest()
      .post('/api/v1/auth/signup')
      .send({
        email: 'smoketest_' + Date.now() + '@example.com',
        password: 'TestPass123!',
        name: 'Smoke Test User',
      });

    // Should get a valid HTTP response (not 404, not 500)
    expect([200, 201, 400, 401, 409, 422]).toContain(response.status);
    expect(response.body).toBeDefined();
  });

  // Test 4: Session endpoint requires auth
  it('GET /api/v1/auth/session should require authentication', async () => {
    const response = await createRequest().get('/api/v1/auth/session');

    // Should return 401 (unauthorized) when no token provided
    expect([401, 403]).toContain(response.status);
  });
});
