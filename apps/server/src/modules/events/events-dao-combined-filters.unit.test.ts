import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/db.js';
const mockedPrisma = vi.mocked(prisma, true);
import * as eventDao from './dao.js';
const mockedEventDao = vi.mocked(eventDao);

// El dao construye `where.AND` siempre como array, pero Prisma lo tipa como `X | X[]`.
const andOf = (where: Prisma.eventsWhereInput) =>
  Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];

// `eventDate` se tipa como `string | Date | DateTimeFilter`; el rango se expresa con `gte`/`lte`.
const hasDateFrom = (cond: Prisma.eventsWhereInput) => {
  const date = cond.eventDate;
  return typeof date === 'object' && date !== null && 'gte' in date;
};

const hasDateRange = (cond: Prisma.eventsWhereInput) => {
  const date = cond.eventDate;
  return (
    typeof date === 'object' && date !== null && 'gte' in date && 'lte' in date
  );
};

vi.mock('../../config/db.js', () => {
  const original = vi.importActual('../../config/db.js');
  return {
    ...original,
    prisma: {
      events: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
    },
  };
});

describe('Events DAO – Combined Filters (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.events.findMany.mockResolvedValue([]);
    mockedPrisma.events.count.mockResolvedValue(0);
  });

  // 5.1 — Each filter in isolation
  describe('individual filter conditions', () => {
    it('type filter adds exact match on eventTypeId', async () => {
      await mockedEventDao.getAllEvents({ type: 2 });
      const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toContainEqual({ eventTypeId: 2 });
    });

    it('dateFrom filter adds gte on eventDate', async () => {
      const dateFrom = new Date('2025-01-01');
      await mockedEventDao.getAllEvents({ dateFrom });
      const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toContainEqual({ eventDate: { gte: dateFrom } });
    });

    it('dateTo filter adds lte on eventDate normalized to end-of-day', async () => {
      const dateTo = new Date('2025-12-31');
      await mockedEventDao.getAllEvents({ dateTo });
      const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where;
      const expectedEndOfDay = new Date(
        dateTo.getTime() + 24 * 60 * 60 * 1000 - 1
      );
      expect(whereArg.AND).toContainEqual({
        eventDate: { lte: expectedEndOfDay },
      });
    });

    it('dateFrom and dateTo together create single eventDate range condition', async () => {
      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-12-31');
      await mockedEventDao.getAllEvents({ dateFrom, dateTo });
      const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where;
      const expectedEndOfDay = new Date(
        dateTo.getTime() + 24 * 60 * 60 * 1000 - 1
      );
      expect(whereArg.AND).toContainEqual({
        eventDate: { gte: dateFrom, lte: expectedEndOfDay },
      });
    });

    it('speaker filter adds case-insensitive contains', async () => {
      await mockedEventDao.getAllEvents({ speaker: 'John' });
      const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toContainEqual({
        speaker: { contains: 'John', mode: 'insensitive' },
      });
    });

    it('status=upcoming adds OR condition for future dates or today with endTime > now', async () => {
      await mockedEventDao.getAllEvents({ status: 'upcoming' });
      const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where;
      const statusCondition = andOf(whereArg).find((c) => c.OR);
      expect(statusCondition).toBeDefined();
      expect(statusCondition.OR).toHaveLength(2);
      expect(statusCondition.OR[0]).toHaveProperty('eventDate.gt');
      expect(statusCondition.OR[1]).toHaveProperty('AND');
    });

    it('status=past adds OR condition for past dates or today with endTime <= now', async () => {
      await mockedEventDao.getAllEvents({ status: 'past' });
      const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where;
      const statusCondition = andOf(whereArg).find((c) => c.OR);
      expect(statusCondition).toBeDefined();
      expect(statusCondition.OR).toHaveLength(2);
      expect(statusCondition.OR[0]).toHaveProperty('eventDate.lt');
      expect(statusCondition.OR[1]).toHaveProperty('AND');
    });

    it('status=all adds no status condition', async () => {
      await mockedEventDao.getAllEvents({ status: 'all' });
      const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where;
      const statusCondition = andOf(whereArg).find(
        (c) => c.OR && c.OR.some((o) => o.eventDate)
      );
      expect(statusCondition).toBeUndefined();
    });

    it('searchQuery adds OR block on title/description/speaker', async () => {
      await mockedEventDao.getAllEvents({ searchQuery: 'tech' });
      const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where;
      const searchCondition = andOf(whereArg).find((c) => c.OR);
      expect(searchCondition).toBeDefined();
      expect(searchCondition.OR).toHaveLength(3);
      expect(searchCondition.OR[0]).toEqual({
        title: { contains: 'tech', mode: 'insensitive' },
      });
      expect(searchCondition.OR[1]).toEqual({
        description: { contains: 'tech', mode: 'insensitive' },
      });
      expect(searchCondition.OR[2]).toEqual({
        speaker: { contains: 'tech', mode: 'insensitive' },
      });
    });
  });

  // 5.2 — Combined filters (AND logic)
  describe('combined filters (AND logic)', () => {
    it('type + dateFrom + speaker combines all conditions with AND', async () => {
      await mockedEventDao.getAllEvents({
        type: 1,
        dateFrom: new Date('2025-01-01'),
        speaker: 'Smith',
      });
      const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toContainEqual({ eventTypeId: 1 });
      expect(whereArg.AND).toContainEqual({
        eventDate: { gte: new Date('2025-01-01') },
      });
      expect(whereArg.AND).toContainEqual({
        speaker: { contains: 'Smith', mode: 'insensitive' },
      });
    });

    it('status=upcoming + dateFrom combines both conditions', async () => {
      await mockedEventDao.getAllEvents({
        status: 'upcoming',
        dateFrom: new Date('2025-06-01'),
      });
      const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where;
      const statusCond = andOf(whereArg).find((c) => c.OR);
      const dateCond = andOf(whereArg).find(hasDateFrom);
      expect(statusCond).toBeDefined();
      expect(dateCond).toBeDefined();
    });

    it('type + status + speaker + date range all combined', async () => {
      await mockedEventDao.getAllEvents({
        type: 3,
        status: 'past',
        speaker: 'Johnson',
        dateFrom: new Date('2025-01-01'),
        dateTo: new Date('2025-06-30'),
      });
      const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toContainEqual({ eventTypeId: 3 });
      expect(whereArg.AND).toContainEqual({
        speaker: { contains: 'Johnson', mode: 'insensitive' },
      });
      const dateCond = andOf(whereArg).find(hasDateRange);
      expect(dateCond).toBeDefined();
      const statusCond = andOf(whereArg).find((c) => c.OR);
      expect(statusCond).toBeDefined();
    });
  });

  // 5.3 — Empty conditions
  describe('empty conditions (only deletedAt: null)', () => {
    it('no user filters provides only deletedAt: null condition', async () => {
      await mockedEventDao.getAllEvents({});
      const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toHaveLength(1);
      expect(whereArg.AND[0]).toEqual({ deletedAt: null });
    });

    it('showDeleted=true with no filters produces empty where', async () => {
      await mockedEventDao.getAllEvents({ showDeleted: true });
      const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg).toEqual({});
    });

    it('undefined filters treated as no filter', async () => {
      await mockedEventDao.getAllEvents({
        type: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        speaker: undefined,
        status: undefined,
      });
      const whereArg = mockedPrisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toHaveLength(1);
      expect(whereArg.AND[0]).toEqual({ deletedAt: null });
    });
  });
});
