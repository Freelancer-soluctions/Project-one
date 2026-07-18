import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../../src/config/db.js';
import * as eventDao from '../../src/modules/events/dao.js';

vi.mock('../../src/config/db.js', () => {
  const original = vi.importActual('../../src/config/db.js');
  return {
    ...original,
    prisma: {
      events: {
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
    },
  };
});

describe('Events DAO – Soft Delete (Unit)', () => {
  const mockEvent = {
    id: 1,
    title: 'Test Event',
    deletedAt: null,
    deletedBy: null,
    updatedOn: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 9.1 softDeleteEventById updates fields instead of deleting
  it('softDeleteEventById updates fields instead of deleting', async () => {
    eventDao.prisma.events.findUnique.mockResolvedValue(mockEvent);
    eventDao.prisma.events.update.mockResolvedValue({
      ...mockEvent,
      deletedAt: new Date(),
      deletedBy: 99,
      updatedOn: new Date(),
    });

    const result = await eventDao.softDeleteEventById(1, 99);

    expect(eventDao.prisma.events.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        deletedAt: expect.any(Date),
        deletedBy: 99,
        updatedOn: expect.any(Date),
      },
    });
    expect(result.status).toBe('deleted');
    expect(result.event.deletedAt).not.toBeNull();
    expect(result.event.deletedBy).toBe(99);
  });

  // 9.2 Returns { status: 'not-found' } for non-existent event
  it('returns { status: "not-found" } for non-existent event', async () => {
    eventDao.prisma.events.findUnique.mockResolvedValue(null);
    const result = await eventDao.softDeleteEventById(999, 1);
    expect(result).toEqual({ status: 'not-found' });
  });

  // 9.3 Returns { status: 'already-deleted' } for already-deleted event
  it('returns { status: "already-deleted" } for already-deleted event', async () => {
    const deletedEvent = { ...mockEvent, deletedAt: new Date(), deletedBy: 5 };
    eventDao.prisma.events.findUnique.mockResolvedValue(deletedEvent);
    const result = await eventDao.softDeleteEventById(1, 10);
    expect(result).toEqual({ status: 'already-deleted' });
  });

  // 9.4 getAllEvents adds deletedAt: null filter by default
  it('getAllEvents adds deletedAt: null filter by default', async () => {
    eventDao.prisma.events.findMany.mockResolvedValue([mockEvent]);
    eventDao.prisma.events.count.mockResolvedValue(1);
    await eventDao.getAllEvents({ showDeleted: false });
    const whereArg = eventDao.prisma.events.findMany.mock.calls[0][0].where;
    expect(whereArg).toHaveProperty('deletedAt', null);
  });

  // 9.5 getAllEvents omits deletedAt filter when showDeleted=true
  it('getAllEvents omits deletedAt filter when showDeleted=true', async () => {
    eventDao.prisma.events.findMany.mockResolvedValue([]);
    eventDao.prisma.events.count.mockResolvedValue(0);
    await eventDao.getAllEvents({ showDeleted: true });
    const whereArg = eventDao.prisma.events.findMany.mock.calls[0][0].where;
    expect(whereArg).not.toHaveProperty('deletedAt');
  });

  // 9.6 getAllEvents with showDeleted=true includes deleted events in pagination total
  it('getAllEvents with showDeleted=true includes deleted events in pagination total', async () => {
    const deletedEvent = { ...mockEvent, deletedAt: new Date(), deletedBy: 2 };
    eventDao.prisma.events.findMany.mockResolvedValue([deletedEvent]);
    eventDao.prisma.events.count.mockResolvedValue(1);
    const result = await eventDao.getAllEvents({ showDeleted: true });
    expect(result.total).toBe(1);
    expect(result.data[0].deletedAt).not.toBeNull();
  });

  // 9.7 restoreEventById clears deletedAt and deletedBy
  it('restoreEventById clears deletedAt and deletedBy', async () => {
    const deletedEvent = { ...mockEvent, deletedAt: new Date(), deletedBy: 3 };
    eventDao.prisma.events.findUnique.mockResolvedValue(deletedEvent);
    eventDao.prisma.events.update.mockResolvedValue({
      ...deletedEvent,
      deletedAt: null,
      deletedBy: null,
      updatedOn: new Date(),
    });
    const result = await eventDao.restoreEventById(1);
    expect(eventDao.prisma.events.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        deletedAt: null,
        deletedBy: null,
        updatedOn: expect.any(Date),
      },
    });
    expect(result.deletedAt).toBeNull();
    expect(result.deletedBy).toBeNull();
  });
});