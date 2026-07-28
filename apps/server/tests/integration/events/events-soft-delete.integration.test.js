import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock DB to prevent PrismaClient hang — needs real PostgreSQL
vi.mock('../../../src/config/db.js', () => ({ prisma: {}, Prisma: {} }));
// Mock encryption to prevent AES_GCM_KEY env var error at module load time
vi.mock('../../../src/utils/prisma/prisma-query.js', () => ({
  decryptResults: (data) => data,
}));

import request from 'supertest';
import app from '../../../src/app.js';

describe.skip('Events Soft Delete – Integration', () => {
  const adminToken = 'mock-admin-token';
  const userToken = 'mock-user-token';

  beforeEach(() => {
    // Mock auth middleware to set req.userId and req.userRole
    vi.mock('../../../src/middleware/auth.js', () => ({
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

  // 9.11 DELETE returns 200 and soft-deletes event
  it('DELETE /events/:id returns 200 and soft-deletes event', async () => {
    const res = await request(app)
      .delete('/api/v1/events/1')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
  });

  // 9.12 DELETE returns 409 Conflict for already-deleted event
  it('DELETE /events/:id returns 409 Conflict for already-deleted event', async () => {
    // Pre-soft-delete event 1
    await request(app).delete('/api/v1/events/1').set('Authorization', `Bearer ${adminToken}`);
    
    const res = await request(app)
      .delete('/api/v1/events/1')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Event already deleted');
  });

  // 9.13 DELETE returns 404 for non-existent event
  it('DELETE /events/:id returns 404 for non-existent event', async () => {
    const res = await request(app)
      .delete('/api/v1/events/999')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Event not found');
  });

  // 9.14 GET excludes soft-deleted events by default
  it('GET /events excludes soft-deleted events by default', async () => {
    // Soft-delete event 1
    await request(app).delete('/api/v1/events/1').set('Authorization', `Bearer ${adminToken}`);
    
    const res = await request(app)
      .get('/api/v1/events')
      .set('Authorization', `Bearer ${adminToken}`);
    
    const event1 = res.body.data.find(e => e.id === 1);
    expect(event1).toBeUndefined();
  });

  // 9.15 GET with ?showDeleted=true as ADMIN includes soft-deleted events
  it('GET /events?showDeleted=true as ADMIN includes soft-deleted events', async () => {
    await request(app).delete('/api/v1/events/1').set('Authorization', `Bearer ${adminToken}`);
    
    const res = await request(app)
      .get('/api/v1/events?showDeleted=true')
      .set('Authorization', `Bearer ${adminToken}`);
    
    const event1 = res.body.data.find(e => e.id === 1);
    expect(event1).toBeDefined();
    expect(event1.deletedAt).not.toBeNull();
  });

  // 9.16 Pagination total includes deleted events when showDeleted=true
  it('GET /events?showDeleted=true pagination total includes deleted events', async () => {
    await request(app).delete('/api/v1/events/1').set('Authorization', `Bearer ${adminToken}`);
    
    const res = await request(app)
      .get('/api/v1/events?showDeleted=true')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.body.total).toBeGreaterThan(0);
  });

  // 9.17 GET with ?showDeleted=true as non-ADMIN returns 403
  it('GET /events?showDeleted=true as non-ADMIN returns 403', async () => {
    const res = await request(app)
      .get('/api/v1/events?showDeleted=true')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access denied');
  });

  // 9.18 PATCH with deletedAt: null restores a soft-deleted event
  it('PATCH /events/:id with deletedAt: null restores a soft-deleted event', async () => {
    await request(app).delete('/api/v1/events/1').set('Authorization', `Bearer ${adminToken}`);
    
    const res = await request(app)
      .patch('/api/v1/events/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ deletedAt: null });
    
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Item updated successfully');
  });

  // 9.19 PATCH with deletedAt: null on active event is a no-op
  it('PATCH /events/:id with deletedAt: null on active event is a no-op', async () => {
    const res = await request(app)
      .patch('/api/v1/events/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ deletedAt: null });
    
    expect(res.status).toBe(200);
  });

  // 9.20 Combined restore + field update
  it('PATCH /events/:id with { deletedAt: null, title: "Restored Title" } restores AND updates', async () => {
    await request(app).delete('/api/v1/events/1').set('Authorization', `Bearer ${adminToken}`);
    
    const res = await request(app)
      .patch('/api/v1/events/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ deletedAt: null, title: "Restored Title" });
    
    expect(res.status).toBe(200);
  });

  // 9.21 USER role cannot restore (returns 403)
  it('USER role cannot restore (returns 403)', async () => {
    await request(app).delete('/api/v1/events/1').set('Authorization', `Bearer ${adminToken}`);
    
    const res = await request(app)
      .patch('/api/v1/events/1')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ deletedAt: null });
    
    expect(res.status).toBe(403);
  });
});