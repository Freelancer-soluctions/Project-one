import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as eventService from './service.js';
import * as eventDao from './dao.js';

vi.mock('./dao.js', () => ({
  getAllEvents: vi.fn(),
}));

describe('Events Service – Combined Filters (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventDao.getAllEvents.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
  });

  // 5.1 — Each filter passed through
  describe('passes filter params to DAO', () => {
    it('passes type parameter', async () => {
      await eventService.getAllEvents({ type: 3 });
      expect(eventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({ type: 3 })
      );
    });

    it('passes dateFrom as Date object', async () => {
      await eventService.getAllEvents({ dateFrom: '2025-01-01' });
      expect(eventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({ dateFrom: expect.any(Date) })
      );
      const callArg = eventDao.getAllEvents.mock.calls[0][0];
      expect(callArg.dateFrom).toEqual(new Date('2025-01-01'));
    });

    it('passes dateTo as Date object', async () => {
      await eventService.getAllEvents({ dateTo: '2025-12-31' });
      expect(eventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({ dateTo: expect.any(Date) })
      );
      const callArg = eventDao.getAllEvents.mock.calls[0][0];
      expect(callArg.dateTo).toEqual(new Date('2025-12-31'));
    });

    it('passes speaker parameter', async () => {
      await eventService.getAllEvents({ speaker: 'John Doe' });
      expect(eventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({ speaker: 'John Doe' })
      );
    });

    it('passes status parameter', async () => {
      await eventService.getAllEvents({ status: 'upcoming' });
      expect(eventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'upcoming' })
      );
    });

    it('passes searchQuery parameter', async () => {
      await eventService.getAllEvents({ searchQuery: 'tech' });
      expect(eventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({ searchQuery: 'tech' })
      );
    });

    it('passes pagination and showDeleted', async () => {
      await eventService.getAllEvents({
        page: 2,
        limit: 10,
        showDeleted: true,
      });
      expect(eventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 10,
          showDeleted: true,
        })
      );
    });

    it('passes all filters combined', async () => {
      await eventService.getAllEvents({
        type: 1,
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
        speaker: 'Smith',
        status: 'past',
        searchQuery: 'conference',
        page: 1,
        limit: 5,
        showDeleted: false,
      });
      expect(eventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 1,
          dateFrom: expect.any(Date),
          dateTo: expect.any(Date),
          speaker: 'Smith',
          status: 'past',
          searchQuery: 'conference',
          page: 1,
          pageSize: 5,
          showDeleted: false,
        })
      );
    });

    it('handles undefined filters gracefully', async () => {
      await eventService.getAllEvents({
        type: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        speaker: undefined,
        status: undefined,
      });
      const callArg = eventDao.getAllEvents.mock.calls[0][0];
      expect(callArg.type).toBeUndefined();
      expect(callArg.dateFrom).toBeUndefined();
      expect(callArg.dateTo).toBeUndefined();
      expect(callArg.speaker).toBeUndefined();
      expect(callArg.status).toBeUndefined();
    });
  });

  // 5.3 — Formats response times
  describe('formats response times', () => {
    it('converts startTime and endTime to HH:mm format', async () => {
      const mockEvent = {
        id: 1,
        title: 'Test',
        startTime: new Date('1970-01-01T14:30:00.000Z'),
        endTime: new Date('1970-01-01T16:45:00.000Z'),
      };
      eventDao.getAllEvents.mockResolvedValue({
        data: [mockEvent],
        total: 1,
        page: 1,
        pageSize: 20,
      });

      const result = await eventService.getAllEvents({});

      expect(result.data[0].startTime).toBe('14:30');
      expect(result.data[0].endTime).toBe('16:45');
    });
  });
});
