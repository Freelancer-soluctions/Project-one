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

vi.mock('../../config/db.js', () => ({
  prisma: {
    events: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
  Prisma: {},
}));

import { prisma } from '../../config/db.js';
const mockedPrisma = vi.mocked(prisma, true);
import * as eventDao from './dao.js';
const mockedEventDao = vi.mocked(eventDao);

describe('Events DAO – Soft Delete (Unit)', () => {
  const mockEvent = eventRow({
    deletedBy: null,
    updatedOn: new Date(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 9.1 softDeleteEventById updates fields instead of deleting
  it('softDeleteEventById updates fields instead of deleting', async () => {
    mockedPrisma.events.findUnique.mockResolvedValue(mockEvent);
    mockedPrisma.events.update.mockResolvedValue({
      ...mockEvent,
      deletedAt: new Date(),
      deletedBy: 99,
      updatedOn: new Date(),
    });

    const result = await mockedEventDao.softDeleteEventById(1, 99);

    expect(mockedPrisma.events.update).toHaveBeenCalledWith({
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
    mockedPrisma.events.findUnique.mockResolvedValue(null);
    const result = await mockedEventDao.softDeleteEventById(999, 1);
    expect(result).toEqual({ status: 'not-found' });
  });

  // 9.3 Returns { status: 'already-deleted' } for already-deleted event
  it('returns { status: "already-deleted" } for already-deleted event', async () => {
    const deletedEvent = eventRow({
      ...mockEvent,
      deletedAt: new Date(),
      deletedBy: 5,
    });
    mockedPrisma.events.findUnique.mockResolvedValue(deletedEvent);
    const result = await mockedEventDao.softDeleteEventById(1, 10);
    expect(result).toEqual({ status: 'already-deleted' });
  });

  // 9.4 getAllEvents adds deletedAt: null filter by default
  it('getAllEvents adds deletedAt: null filter by default', async () => {
    mockedPrisma.events.findMany.mockResolvedValue([mockEvent]);
    mockedPrisma.events.count.mockResolvedValue(1);
    await mockedEventDao.getAllEvents({ showDeleted: false });
    const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where as {
      AND: Array<Record<string, unknown>>;
    };
    expect(whereArg.AND[0]).toHaveProperty('deletedAt', null);
  });

  // 9.5 getAllEvents omits deletedAt filter when showDeleted=true
  it('getAllEvents omits deletedAt filter when showDeleted=true', async () => {
    mockedPrisma.events.findMany.mockResolvedValue([]);
    mockedPrisma.events.count.mockResolvedValue(0);
    await mockedEventDao.getAllEvents({ showDeleted: true });
    const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where as {
      AND: Array<Record<string, unknown>>;
    };
    expect(whereArg).not.toHaveProperty('deletedAt');
  });

  // 9.6 getAllEvents with showDeleted=true includes deleted events in pagination total
  it('getAllEvents with showDeleted=true includes deleted events in pagination total', async () => {
    const deletedEvent = { ...mockEvent, deletedAt: new Date(), deletedBy: 2 };
    mockedPrisma.events.findMany.mockResolvedValue([deletedEvent]);
    mockedPrisma.events.count.mockResolvedValue(1);
    const result = await mockedEventDao.getAllEvents({ showDeleted: true });
    expect(result.total).toBe(1);
    expect(result.data[0].deletedAt).not.toBeNull();
  });

  // 9.7 restoreEventById clears deletedAt and deletedBy
  it('restoreEventById clears deletedAt and deletedBy', async () => {
    const deletedEvent = { ...mockEvent, deletedAt: new Date(), deletedBy: 3 };
    mockedPrisma.events.findUnique.mockResolvedValue(deletedEvent);
    mockedPrisma.events.update.mockResolvedValue({
      ...deletedEvent,
      deletedAt: null,
      deletedBy: null,
      updatedOn: new Date(),
    });
    const result = await mockedEventDao.restoreEventById(1);
    expect(mockedPrisma.events.update).toHaveBeenCalledWith({
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
