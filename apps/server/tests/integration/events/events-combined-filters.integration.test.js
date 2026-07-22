import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Events Combined Filters – Integration', () => {
  const adminToken = 'mock-admin-token';
  const userToken = 'mock-user-token';

  beforeEach(() => {
    // Mock auth middleware to set req.userId and req.userRole
    vi.mock('../../src/middleware/auth.js', () => ({
      verifyToken: (req, res, next) => {
        if (req.headers.authorization === `Bearer ${adminToken}`) {
          req.userId = 1;
          req.userRole = 'ADMIN';
        } else if (req.headers.authorization === `Bearer ${userToken}`) {
          req.userId = 2;
          req.userRole = 'USER';
        }
        next();
      },
    }));
  });

  // 5.4.1 type filter (GET /events?type=1 returns 200)
  it('GET /events?type=1 returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?type=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
  });

  // 5.4.2 dateFrom/dateTo (range)
  it('GET /events?dateFrom=2025-01-01&dateTo=2025-12-31 returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?dateFrom=2025-01-01&dateTo=2025-12-31')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 5.4.3 speaker filter
  it('GET /events?speaker=John returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?speaker=John')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 5.4.4 status=upcoming
  it('GET /events?status=upcoming returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?status=upcoming')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 5.4.5 status=past
  it('GET /events?status=past returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?status=past')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 5.5 Combined filter scenarios
  it('GET /events with status=upcoming + dateFrom + speaker returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?status=upcoming&dateFrom=2025-01-01&speaker=John')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /events with type + dateFrom + dateTo + speaker returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?type=1&dateFrom=2025-01-01&dateTo=2025-12-31&speaker=Tech')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /events with status=past + type + dateTo returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?status=past&type=2&dateTo=2025-06-30')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /events with all filters combined returns 200', async () => {
    const res = await request(app)
      .get('/api/v1/events?type=1&dateFrom=2025-01-01&dateTo=2025-12-31&speaker=John&status=upcoming')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
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
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('limit', 10);
  });

  it('GET /events?searchQuery=conference returns 200 (searchQuery only)', async () => {
    const res = await request(app)
      .get('/api/v1/events?searchQuery=conference')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /events?page=2&limit=5 returns 200 (pagination only)', async () => {
    const res = await request(app)
      .get('/api/v1/events?page=2&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('page', 2);
    expect(res.body).toHaveProperty('limit', 5);
  });

  it('GET /events?searchQuery=tech&type=1 returns 200 (searchQuery + new filter)', async () => {
    const res = await request(app)
      .get('/api/v1/events?searchQuery=tech&type=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /events?searchQuery=event&status=upcoming&page=1&limit=20 returns 200 (all old + new params)', async () => {
    const res = await request(app)
      .get('/api/v1/events?searchQuery=event&status=upcoming&page=1&limit=20')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('limit', 20);
  });
});