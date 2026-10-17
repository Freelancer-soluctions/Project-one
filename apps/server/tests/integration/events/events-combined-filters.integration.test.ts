import { describe, it, expect, vi } from 'vitest';

// Mock encryption - AES_GCM_KEY is provided in .env.test for CI
vi.mock('../../../src/utils/prisma/prisma-query.js', () => ({
  decryptResults: (data) => data,
}));

// Hoisted constants for use in mocks
const { adminToken, userToken } = vi.hoisted(() => ({
  adminToken: 'mock-admin-token',
  userToken: 'mock-user-token',
}));

// Mock middleware/index.js - this is what routes import from
// Provide mocked auth/role middleware and passthrough validation middleware
vi.mock('../../../src/middleware/index.js', () => {
  const ROLESCODES = { ADMIN: 'C01', USER: 'C02', MANAGER: 'C03' };

  const mockUsers = {
    1: {
      roles: { code: 'C01' },
      permits: [{ permissions: { code: 'canViewEvents' } }],
    },
    2: {
      roles: { code: 'C02' },
      permits: [{ permissions: { code: 'canViewEvents' } }],
    },
  };

  // Passthrough validation middleware factories - return middleware that calls next()
  const passthroughFactory = (schema) => (req, res, next) => {
    void schema; // schema intentionally ignored - passthrough mock
    return next();
  };
  const passthroughMiddleware = (req, res, next) => next();
  const passthroughFactoryWithParam = (paramName) => (req, res, next) => {
    void paramName; // paramName intentionally ignored - passthrough mock
    return next();
  };
  const passthroughFactoryWithLogger = (logger) => (req, res, next) => {
    void logger; // logger intentionally ignored - passthrough mock
    return next();
  };

  return {
    // Auth middleware
    verifyToken: (req, res, next) => {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (authHeader === `Bearer ${adminToken}`) {
        req.userId = 1;
        req.userRole = 'ADMIN';
        req.user = { id: 1, role: 'ADMIN' };
      } else if (authHeader === `Bearer ${userToken}`) {
        req.userId = 2;
        req.userRole = 'USER';
        req.user = { id: 2, role: 'USER' };
      } else {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      next();
    },

    // Role middleware factories
    checkRoleAuth:
      ({ allowedRoles = [] }) =>
      (req, res, next) => {
        try {
          const user = mockUsers[req.userId];
          if (!user || !user?.roles?.code) {
            return res.status(403).json({ error: 'Could not verify role' });
          }
          const userRole = user.roles.code;
          if (!allowedRoles.includes(userRole)) {
            return res
              .status(403)
              .json({ error: 'You do not have sufficient permissions' });
          }
          next();
        } catch {
          res.status(500).json({ error: 'Error in permission verification' });
        }
      },

    checkRoleAuthOrPermisssion:
      ({ allowedRoles = [], permissions = [] }) =>
      (req, res, next) => {
        try {
          const user = mockUsers[req.userId];
          if (!user || !user.roles?.code) {
            return res
              .status(403)
              .json({ error: 'Could not verify user role or permissions' });
          }
          const userRoleCode = user.roles.code;
          if (userRoleCode === ROLESCODES.ADMIN) {
            return next();
          }
          if (allowedRoles.length > 0 && !allowedRoles.includes(userRoleCode)) {
            return res
              .status(403)
              .json({ error: 'Role not authorized for this action' });
          }
          if (permissions.length === 0) {
            return next();
          }
          const rolePermissions =
            user.permits?.map((rp) => rp.permissions.code) || [];
          const hasSomePermission = permissions.some((p) =>
            rolePermissions.includes(p)
          );
          if (!hasSomePermission) {
            return res
              .status(403)
              .json({ error: 'Insufficient permissions for this operation' });
          }
          next();
        } catch (error) {
          console.error('Middleware auth error:', error);
          return res
            .status(500)
            .json({ error: 'Internal error in permission verification' });
        }
      },

    // Validation middleware - passthrough factories for tests
    validateQueryParams: passthroughFactory,
    validateSchema: passthroughFactory,
    validatePathParam: passthroughMiddleware,
    validateNumericPathParam: passthroughFactoryWithParam,

    // Other middleware - passthrough
    errorHandler: passthroughMiddleware,
    limiter: passthroughMiddleware,
    loginLimiter: passthroughMiddleware,
    loginLimiterEnhanced: passthroughMiddleware,
    refreshTokenLimiter: passthroughMiddleware,
    changePasswordLimiter: passthroughMiddleware,
    forgotPasswordLimiter: passthroughMiddleware,
    rateLimit: passthroughMiddleware,
    cspReportHandler: passthroughFactoryWithLogger,
  };
});

// Mock CSRF verification for non-GET requests (DELETE, PATCH)
vi.mock('../../../src/middleware/verifyCsrf.js', () => ({
  verifyCsrf: (req, res, next) => next(),
  verifyCsrfOld: (req, res, next) => next(),
  csrfConditional: (req, res, next) => next(),
}));

import request from 'supertest';
import app from '../../../src/app.js';

describe('Events Combined Filters – Integration', () => {
  // 5.4.1 type filter (GET /events?type=1 returns 200)
  it('GET /events?type=1 returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?type=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('page');
    expect(res.body.data).toHaveProperty('limit');
  });

  // 5.4.2 dateFrom/dateTo (range)
  it('GET /events?dateFrom=2025-01-01&dateTo=2025-12-31 returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?dateFrom=2025-01-01&dateTo=2025-12-31')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  // 5.4.3 speaker filter
  it('GET /events?speaker=John returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?speaker=John')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  // 5.4.4 status=upcoming
  it('GET /events?status=upcoming returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?status=upcoming')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  // 5.4.5 status=past
  it('GET /events?status=past returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?status=past')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  // 5.5 Combined filter scenarios
  it('GET /events with status=upcoming + dateFrom + speaker returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?status=upcoming&dateFrom=2025-01-01&speaker=John')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  it('GET /events with type + dateFrom + dateTo + speaker returns 200', async () => {
    const res = await request(app)
      .get(
        '/api/v1/events?type=1&dateFrom=2025-01-01&dateTo=2025-12-31&speaker=Tech'
      )
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  it('GET /events with status=past + type + dateTo returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?status=past&type=2&dateTo=2025-06-30')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  it('GET /events with all filters combined returns 200', async () => {
    const res = await request(app)
      .get(
        '/api/v1/events?type=1&dateFrom=2025-01-01&dateTo=2025-12-31&speaker=John&status=upcoming'
      )
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  // 5.6 Validation tests
  it('GET /events?type=abc returns 400 for invalid type', async () => {
    const res = await request(app)
      .get('/api/v1/events?type=abc')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('GET /events?dateFrom=invalid returns 400 for invalid dateFrom', async () => {
    const res = await request(app)
      .get('/api/v1/events?dateFrom=invalid-date')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('GET /events?dateTo=invalid returns 400 for invalid dateTo', async () => {
    const res = await request(app)
      .get('/api/v1/events?dateTo=not-a-date')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('GET /events?status=invalid returns 400 for invalid status value', async () => {
    const res = await request(app)
      .get('/api/v1/events?status=unknown')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('GET /events?speaker=too-long-speaker-name-that-exceeds-fifty-characters-limit returns 400', async () => {
    const longSpeaker = 'a'.repeat(51);
    const res = await request(app)
      .get(`/api/v1/events?speaker=${longSpeaker}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('GET /events?page=0 returns 400 for invalid page', async () => {
    const res = await request(app)
      .get('/api/v1/events?page=0')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('GET /events?limit=101 returns 400 for limit exceeding max', async () => {
    const res = await request(app)
      .get('/api/v1/events?limit=101')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  // 5.7 Backward compatibility
  it('GET /events?searchQuery=tech&page=1&limit=10 returns 200 (existing searchQuery + pagination)', async () => {
    const res = await request(app)
      .get('/api/v1/events?searchQuery=tech&page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('page', 1);
    expect(res.body.data).toHaveProperty('limit', 10);
  });

  it('GET /events?searchQuery=conference returns 200 (searchQuery only)', async () => {
    const res = await request(app)
      .get('/api/v1/events?searchQuery=conference')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  it('GET /events?page=2&limit=5 returns 200 (pagination only)', async () => {
    const res = await request(app)
      .get('/api/v1/events?page=2&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data).toHaveProperty('page', 2);
    expect(res.body.data).toHaveProperty('limit', 5);
  });

  it('GET /events?searchQuery=tech&type=1 returns 200 (searchQuery + new filter)', async () => {
    const res = await request(app)
      .get('/api/v1/events?searchQuery=tech&type=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  it('GET /events?searchQuery=event&status=upcoming&page=1&limit=20 returns 200 (all old + new params)', async () => {
    const res = await request(app)
      .get('/api/v1/events?searchQuery=event&status=upcoming&page=1&limit=20')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data).toHaveProperty('page', 1);
    expect(res.body.data).toHaveProperty('limit', 20);
  });
});
