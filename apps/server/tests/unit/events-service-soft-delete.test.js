import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as eventService from '../../src/modules/events/service.js';
import * as eventDao from '../../src/modules/events/dao.js';
import { Prisma } from '@prisma/client';

vi.mock('../../src/modules/events/dao.js', () => ({
  softDeleteEventById: vi.fn(),
  restoreEventById: vi.fn(),
  updateEventById: vi.fn(),
  getEventById: vi.fn(),
  getAllEvents: vi.fn(),
}));

describe('Events Service – Soft Delete (Unit)', () => {
  const mockEvent = { id: 1, deletedAt: new Date(), deletedBy: null };
  const mockDeletedEvent = { id: 1, deletedAt: new Date(), deletedBy: 5 };
  const mockActiveEvent = { id: 1, deletedAt: null, deletedBy: null };

  // Helper to setup mocks per test
  const setupMocks = (overrides = {}) => {
    // Default mock behaviors
    vi.spyOn(eventDao, 'softDeleteEventById').mockResolvedValue({ status: 'deleted', event: mockEvent });
    vi.spyOn(eventDao, 'restoreEventById').mockResolvedValue(mockEvent);
    vi.spyOn(eventDao, 'updateEventById').mockResolvedValue({});
    vi.spyOn(eventDao, 'getEventById').mockResolvedValue(mockEvent);

    // Override behavior as needed via overrides parameter
    if (overrides && typeof overrides === 'function') overrides();
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 9.8 deleteEventById passes userId to DAO and translates status codes
  it('deleteEventById passes userId to DAO and translates status codes', async () => {
    // Success case
    setupMocks();
    eventDao.softDeleteEventById.mockResolvedValueOnce({ status: 'deleted', event: { id: 1 } });
    const res1 = await eventService.deleteEventById(1, 99);
    expect(eventDao.softDeleteEventById).toHaveBeenCalledWith(1, 99);
    expect(res1).toEqual({ id: 1 });

    // Not found case
    eventDao.softDeleteEventById.mockResolvedValueOnce({ status: 'not-found' });
    await expect(eventService.deleteEventById(999, 99)).rejects.toThrow('Event not found');

    // Already deleted case
    eventDao.softDeleteEventById.mockResolvedValueOnce({ status: 'already-deleted' });
    await expect(eventService.deleteEventById(1, 99)).rejects.toThrow('Event already deleted');
  });

  // 9.9 updateEventById detects restore when deletedAt === null on soft-deleted event
  it('updateEventById detects restore when deletedAt === null on soft-deleted event', async () => {
    // Mock getting the current event state first
    vi.spyOn(eventDao, 'getEventById').mockResolvedValue(mockDeletedEvent);

    // Mock restore call
    vi.spyOn(eventDao, 'restoreEventById').mockResolvedValue({ ...mockDeletedEvent, deletedAt: null, deletedBy: null });

    // Spy on the DAO call to ensure it happens
    const restoreSpy = vi.spyOn(eventDao, 'restoreEventById');

    const result = await eventService.updateEventById(1, { deletedAt: null, title: 'New Title' });
    
    expect(restoreSpy).toHaveBeenCalledWith(1);
    expect(result.deletedAt).toBeNull();
    expect(result.deletedBy).toBeNull();
    expect(result.title).toBe('New Title'); // Additional fields should be preserved
  });

  // 9.10 restore-only request results in no-op on active event
  it('restore-only request results in no-op on active event', async () => {
    setupMocks(); // uses default mocks (stub restoreEventById etc.)

    // Override getEventById to return an active event (deletedAt === null)
    vi.spyOn(eventDao, 'getEventById').mockResolvedValue(mockActiveEvent);

    const result = await eventService.updateEventById(1, { deletedAt: null });
    
    // restoreEventById should NOT be called for an already-active event
    expect(eventDao.restoreEventById).not.toHaveBeenCalled();
    // The function returns the result of DAO.updateEventById (which may preserve the event)
    expect(result).toEqual(mockActiveEvent);
  });
});