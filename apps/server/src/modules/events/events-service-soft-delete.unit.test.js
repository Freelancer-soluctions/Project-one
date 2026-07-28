import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock db to prevent PrismaClient instantiation
vi.mock('../../config/db.js', () => ({
  prisma: {},
  Prisma: {},
}));

vi.mock('./dao.js', () => ({
  softDeleteEventById: vi.fn(),
  restoreEventById: vi.fn(),
  updateEventById: vi.fn(),
  getEventById: vi.fn(),
  getAllEvents: vi.fn(),
}));

import * as eventService from './service.js';
import * as eventDao from './dao.js';

describe('Events Service – Soft Delete (Unit)', () => {
  const mockEvent = { id: 1, deletedAt: new Date(), deletedBy: null };
  const mockDeletedEvent = { id: 1, deletedAt: new Date(), deletedBy: 5 };
  const mockActiveEvent = { id: 1, deletedAt: null, deletedBy: null };
  const mockRestoredEvent = { id: 1, deletedAt: null, deletedBy: null };

  // Helper to setup mocks per test
  const setupMocks = (overrides = {}) => {
    eventDao.softDeleteEventById.mockResolvedValue({ status: 'deleted', event: mockEvent });
    eventDao.restoreEventById.mockResolvedValue(mockEvent);
    eventDao.updateEventById.mockResolvedValue({});
    eventDao.getEventById.mockResolvedValue(mockEvent);

    if (overrides && typeof overrides === 'function') overrides();
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 9.8 deleteEventById passes userId to DAO and translates status codes
  it('deleteEventById passes userId to DAO and translates status codes', async () => {
    // Success case
    eventDao.softDeleteEventById.mockResolvedValueOnce({ status: 'deleted', event: { id: 1 } });
    const res1 = await eventService.deleteEventById(1, 99);
    expect(eventDao.softDeleteEventById).toHaveBeenCalledWith(1, 99);
    // Service wraps result: { status: 200, event: result.event }
    expect(res1).toEqual({ status: 200, event: { id: 1 } });

    // Not found case
    eventDao.softDeleteEventById.mockResolvedValueOnce({ status: 'not-found' });
    const res2 = await eventService.deleteEventById(999, 99);
    expect(res2).toEqual({ status: 404, message: 'Event not found' });

    // Already deleted case
    eventDao.softDeleteEventById.mockResolvedValueOnce({ status: 'already-deleted' });
    const res3 = await eventService.deleteEventById(1, 99);
    expect(res3).toEqual({ status: 409, message: 'Event already deleted' });
  });

  // 9.9 updateEventById detects restore when deletedAt === null on soft-deleted event
  it('updateEventById detects restore when deletedAt === null on soft-deleted event', async () => {
    eventDao.getEventById.mockResolvedValue(mockDeletedEvent);
    eventDao.restoreEventById.mockResolvedValue(mockRestoredEvent);
    eventDao.updateEventById.mockResolvedValue({
      ...mockRestoredEvent,
      title: 'New Title',
      startTime: new Date(Date.UTC(1970, 0, 1, 10, 0)),
      endTime: new Date(Date.UTC(1970, 0, 1, 11, 0)),
    });

    const result = await eventService.updateEventById(1, { deletedAt: null, title: 'New Title' });

    expect(eventDao.restoreEventById).toHaveBeenCalledWith(1);
    expect(result.deletedAt).toBeNull();
    expect(result.deletedBy).toBeNull();
    expect(result.title).toBe('New Title');
  });

  // 9.10 restore-only request results in no-op on active event
  it('restore-only request results in no-op on active event', async () => {
    setupMocks();
    eventDao.restoreEventById.mockResolvedValue(mockActiveEvent);

    const result = await eventService.updateEventById(1, { deletedAt: null });

    // Service always calls restoreEventById for restore requests
    expect(eventDao.restoreEventById).toHaveBeenCalledWith(1);
    expect(result.deletedAt).toBeNull();
    expect(result.id).toBe(1);
  });
});
