import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../../src/config/db.js';
import * as eventDao from '../../src/modules/events/dao.js';

vi.mock('../../src/config/db.js', () => {
  const original = vi.importActual('../../src/config/db.js');
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
    prisma.events.findMany.mockResolvedValue([]);
    prisma.events.count.mockResolvedValue(0);
  });

  // 5.1 — Each filter in isolation
  describe('individual filter conditions', () => {
    it('type filter adds exact match on eventTypeId', async () => {
      await eventDao.getAllEvents({ type: 2 });
      const whereArg = prisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toContainEqual({ eventTypeId: 2 });
    });

    it('dateFrom filter adds gte on eventDate', async () => {
      const dateFrom = new Date('2025-01-01');
      await eventDao.getAllEvents({ dateFrom });
      const whereArg = prisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toContainEqual({ eventDate: { gte: dateFrom } });
    });

    it('dateTo filter adds lte on eventDate normalized to end-of-day', async () => {
      const dateTo = new Date('2025-12-31');
      await eventDao.getAllEvents({ dateTo });
      const whereArg = prisma.events.findMany.mock.calls[0][0].where;
      const expectedEndOfDay = new Date(dateTo.getTime() + 24 * 60 * 60 * 1000 - 1);
      expect(whereArg.AND).toContainEqual({ eventDate: { lte: expectedEndOfDay } });
    });

    it('dateFrom and dateTo together create single eventDate range condition', async () => {
      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-12-31');
      await eventDao.getAllEvents({ dateFrom, dateTo });
      const whereArg = prisma.events.findMany.mock.calls[0][0].where;
      const expectedEndOfDay = new Date(dateTo.getTime() + 24 * 60 * 60 * 1000 - 1);
      expect(whereArg.AND).toContainEqual({ eventDate: { gte: dateFrom, lte: expectedEndOfDay } });
    });

    it('speaker filter adds case-insensitive contains', async () => {
      await eventDao.getAllEvents({ speaker: 'John' });
      const whereArg = prisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toContainEqual({ speaker: { contains: 'John', mode: 'insensitive' } });
    });

    it('status=upcoming adds OR condition for future dates or today with endTime > now', async () => {
      await eventDao.getAllEvents({ status: 'upcoming' });
      const whereArg = prisma.events.findMany.mock.calls[0][0].where;
      const statusCondition = whereArg.AND.find(c => c.OR);
      expect(statusCondition).toBeDefined();
      expect(statusCondition.OR).toHaveLength(2);
      expect(statusCondition.OR[0]).toHaveProperty('eventDate.gt');
      expect(statusCondition.OR[1]).toHaveProperty('AND');
    });

    it('status=past adds OR condition for past dates or today with endTime <= now', async () => {
      await eventDao.getAllEvents({ status: 'past' });
      const whereArg = prisma.events.findMany.mock.calls[0][0].where;
      const statusCondition = whereArg.AND.find(c => c.OR);
      expect(statusCondition).toBeDefined();
      expect(statusCondition.OR).toHaveLength(2);
      expect(statusCondition.OR[0]).toHaveProperty('eventDate.lt');
      expect(statusCondition.OR[1]).toHaveProperty('AND');
    });

    it('status=all adds no status condition', async () => {
      await eventDao.getAllEvents({ status: 'all' });
      const whereArg = prisma.events.findMany.mock.calls[0][0].where;
      const statusCondition = whereArg.AND.find(c => c.OR && c.OR.some(o => o.eventDate));
      expect(statusCondition).toBeUndefined();
    });

    it('searchQuery adds OR block on title/description/speaker', async () => {
      await eventDao.getAllEvents({ searchQuery: 'tech' });
      const whereArg = prisma.events.findMany.mock.calls[0][0].where;
      const searchCondition = whereArg.AND.find(c => c.OR);
      expect(searchCondition).toBeDefined();
      expect(searchCondition.OR).toHaveLength(3);
      expect(searchCondition.OR[0]).toEqual({ title: { contains: 'tech', mode: 'insensitive' } });
      expect(searchCondition.OR[1]).toEqual({ description: { contains: 'tech', mode: 'insensitive' } });
      expect(searchCondition.OR[2]).toEqual({ speaker: { contains: 'tech', mode: 'insensitive' } });
    });
  });

  // 5.2 — Combined filters (AND logic)
  describe('combined filters (AND logic)', () => {
    it('type + dateFrom + speaker combines all conditions with AND', async () => {
      await eventDao.getAllEvents({
        type: 1,
        dateFrom: new Date('2025-01-01'),
        speaker: 'Smith',
      });
      const whereArg = prisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toContainEqual({ eventTypeId: 1 });
      expect(whereArg.AND).toContainEqual({ eventDate: { gte: new Date('2025-01-01') } });
      expect(whereArg.AND).toContainEqual({ speaker: { contains: 'Smith', mode: 'insensitive' } });
    });

    it('status=upcoming + dateFrom combines both conditions', async () => {
      await eventDao.getAllEvents({
        status: 'upcoming',
        dateFrom: new Date('2025-06-01'),
      });
      const whereArg = prisma.events.findMany.mock.calls[0][0].where;
      const statusCond = whereArg.AND.find(c => c.OR);
      const dateCond = whereArg.AND.find(c => c.eventDate && c.eventDate.gte);
      expect(statusCond).toBeDefined();
      expect(dateCond).toBeDefined();
    });

    it('type + status + speaker + date range all combined', async () => {
      await eventDao.getAllEvents({
        type: 3,
        status: 'past',
        speaker: 'Johnson',
        dateFrom: new Date('2025-01-01'),
        dateTo: new Date('2025-06-30'),
      });
      const whereArg = prisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toContainEqual({ eventTypeId: 3 });
      expect(whereArg.AND).toContainEqual({ speaker: { contains: 'Johnson', mode: 'insensitive' } });
      const dateCond = whereArg.AND.find(c => c.eventDate && c.eventDate.gte && c.eventDate.lte);
      expect(dateCond).toBeDefined();
      const statusCond = whereArg.AND.find(c => c.OR);
      expect(statusCond).toBeDefined();
    });
  });

  // 5.3 — Empty conditions
  describe('empty conditions (only deletedAt: null)', () => {
    it('no user filters provides only deletedAt: null condition', async () => {
      await eventDao.getAllEvents({});
      const whereArg = prisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toHaveLength(1);
      expect(whereArg.AND[0]).toEqual({ deletedAt: null });
    });

    it('showDeleted=true with no filters produces empty where', async () => {
      await eventDao.getAllEvents({ showDeleted: true });
      const whereArg = prisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg).toEqual({});
    });

    it('undefined filters treated as no filter', async () => {
      await eventDao.getAllEvents({
        type: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        speaker: undefined,
        status: undefined,
      });
      const whereArg = prisma.events.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toHaveLength(1);
      expect(whereArg.AND[0]).toEqual({ deletedAt: null });
    });
  });
});