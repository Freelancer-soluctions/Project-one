import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { events } from '@prisma/client';

// Fila completa del modelo `events`: los mocks tipados de Prisma exigen la forma completa.
const eventRow = (overrides: Partial<events> = {}): events => ({
  id: 1,
  title: 'Test Event',
  description: 'Test description',
  speaker: null,
  startTime: new Date('2024-01-01T10:00:00.000Z'),
  endTime: new Date('2024-01-01T11:00:00.000Z'),
  eventDate: new Date('2024-01-01T00:00:00.000Z'),
  modality: 'IN_PERSON',
  meetingUrl: null,
  location: null,
  createdBy: 1,
  createdOn: new Date('2024-01-01T00:00:00.000Z'),
  updatedOn: null,
  deletedAt: null,
  deletedBy: null,
  eventTypeId: 1,
  capacity: 10,
  attendeeCount: 0,
  ...overrides,
});

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
const mockedEventDao = vi.mocked(eventDao);

describe('Events Service – Soft Delete (Unit)', () => {
  const mockEvent = eventRow({ id: 1, deletedAt: new Date(), deletedBy: null });
  const mockDeletedEvent = eventRow({
    id: 1,
    deletedAt: new Date(),
    deletedBy: 5,
  });
  const mockActiveEvent = eventRow({ id: 1, deletedAt: null, deletedBy: null });
  const mockRestoredEvent = eventRow({
    id: 1,
    deletedAt: null,
    deletedBy: null,
  });

  // Helper to setup mocks per test
  const setupMocks = (overrides = {}) => {
    mockedEventDao.softDeleteEventById.mockResolvedValue({
      status: 'deleted',
      event: mockEvent,
    });
    mockedEventDao.restoreEventById.mockResolvedValue(mockEvent);
    mockedEventDao.updateEventById.mockResolvedValue(eventRow());
    mockedEventDao.getEventById.mockResolvedValue(mockEvent);

    if (overrides && typeof overrides === 'function') overrides();
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 9.8 deleteEventById passes userId to DAO and translates status codes
  it('deleteEventById passes userId to DAO and translates status codes', async () => {
    // Success case
    const deletedRow = eventRow({ id: 1 });
    mockedEventDao.softDeleteEventById.mockResolvedValueOnce({
      status: 'deleted',
      event: deletedRow,
    });
    const res1 = await eventService.deleteEventById(1, 99);
    expect(mockedEventDao.softDeleteEventById).toHaveBeenCalledWith(1, 99);
    // Service wraps result: { status: 200, event: result.event }
    expect(res1).toEqual({ status: 200, event: deletedRow });

    // Not found case
    mockedEventDao.softDeleteEventById.mockResolvedValueOnce({
      status: 'not-found',
    });
    const res2 = await eventService.deleteEventById(999, 99);
    expect(res2).toEqual({ status: 404, message: 'Event not found' });

    // Already deleted case
    mockedEventDao.softDeleteEventById.mockResolvedValueOnce({
      status: 'already-deleted',
    });
    const res3 = await eventService.deleteEventById(1, 99);
    expect(res3).toEqual({ status: 409, message: 'Event already deleted' });
  });

  // 9.9 updateEventById detects restore when deletedAt === null on soft-deleted event
  it('updateEventById detects restore when deletedAt === null on soft-deleted event', async () => {
    mockedEventDao.getEventById.mockResolvedValue(mockDeletedEvent);
    mockedEventDao.restoreEventById.mockResolvedValue(mockRestoredEvent);
    mockedEventDao.updateEventById.mockResolvedValue({
      ...mockRestoredEvent,
      title: 'New Title',
      startTime: new Date(Date.UTC(1970, 0, 1, 10, 0)),
      endTime: new Date(Date.UTC(1970, 0, 1, 11, 0)),
    });

    const result = await eventService.updateEventById(1, {
      deletedAt: null,
      title: 'New Title',
    });

    expect(mockedEventDao.restoreEventById).toHaveBeenCalledWith(1);
    expect(result!.deletedAt).toBeNull();
    expect(result!.deletedBy).toBeNull();
    expect(result!.title).toBe('New Title');
  });

  // 9.10 restore-only request results in no-op on active event
  it('restore-only request results in no-op on active event', async () => {
    setupMocks();
    mockedEventDao.restoreEventById.mockResolvedValue(mockActiveEvent);

    const result = await eventService.updateEventById(1, { deletedAt: null });

    // Service always calls restoreEventById for restore requests
    expect(mockedEventDao.restoreEventById).toHaveBeenCalledWith(1);
    expect(result!.deletedAt).toBeNull();
    expect(result!.id).toBe(1);
  });
});
