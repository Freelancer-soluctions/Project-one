import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as eventAttendeeService from './service.js';
import * as attendeeDao from './dao.js';
const mockedAttendeeDao = vi.mocked(attendeeDao);

vi.mock('./dao.js', () => ({
  findEarliestWaitlist: vi.fn(),
  updateAttendeeStatus: vi.fn(),
  incrementAttendeeCount: vi.fn(),
  createAuditLog: vi.fn(),
}));

vi.mock('../../../config/db.js', () => ({
  prisma: {},
  Prisma: {},
}));

describe('Event RSVP — promoteFromWaitlist', () => {
  const mockTx = {};
  const mockWaitlist = {
    id: 5,
    eventId: 1,
    userId: 10,
    status: 'WAITLIST',
    createdAt: new Date('2026-01-01'),
  };
  const mockPromoted = { ...mockWaitlist, status: 'CONFIRMED' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no waitlisted attendees', async () => {
    mockedAttendeeDao.findEarliestWaitlist.mockResolvedValue(null);
    const result = await eventAttendeeService.promoteFromWaitlist(1, mockTx);
    expect(result).toBeNull();
    expect(mockedAttendeeDao.updateAttendeeStatus).not.toHaveBeenCalled();
  });

  it('promotes earliest waitlisted attendee to CONFIRMED', async () => {
    mockedAttendeeDao.findEarliestWaitlist.mockResolvedValue(mockWaitlist);
    mockedAttendeeDao.updateAttendeeStatus.mockResolvedValue(mockPromoted);
    mockedAttendeeDao.incrementAttendeeCount.mockResolvedValue({});
    mockedAttendeeDao.createAuditLog.mockResolvedValue({});

    const result = await eventAttendeeService.promoteFromWaitlist(1, mockTx);

    expect(mockedAttendeeDao.findEarliestWaitlist).toHaveBeenCalledWith(
      1,
      mockTx
    );
    expect(mockedAttendeeDao.updateAttendeeStatus).toHaveBeenCalledWith(
      5,
      'CONFIRMED',
      mockTx
    );
    expect(mockedAttendeeDao.incrementAttendeeCount).toHaveBeenCalledWith(
      1,
      mockTx
    );
    expect(mockedAttendeeDao.createAuditLog).toHaveBeenCalledWith(
      {
        attendeeId: 5,
        eventId: 1,
        previousStatus: 'WAITLIST',
        newStatus: 'CONFIRMED',
        changedBy: null,
      },
      mockTx
    );
    expect(result.status).toBe('CONFIRMED');
  });

  it('passes tx object correctly to all DAO calls', async () => {
    mockedAttendeeDao.findEarliestWaitlist.mockResolvedValue(mockWaitlist);
    mockedAttendeeDao.updateAttendeeStatus.mockResolvedValue(mockPromoted);
    mockedAttendeeDao.incrementAttendeeCount.mockResolvedValue({});
    mockedAttendeeDao.createAuditLog.mockResolvedValue({});

    await eventAttendeeService.promoteFromWaitlist(1, mockTx);

    // All DAO calls should receive the same tx
    expect(mockedAttendeeDao.updateAttendeeStatus.mock.calls[0][2]).toBe(
      mockTx
    );
    expect(mockedAttendeeDao.incrementAttendeeCount.mock.calls[0][1]).toBe(
      mockTx
    );
    expect(mockedAttendeeDao.createAuditLog.mock.calls[0][1]).toBe(mockTx);
  });

  it('creates multiple promoted entries when called repeatedly (FIFO chain)', async () => {
    const firstWaitlist = { id: 5, eventId: 1, userId: 10, status: 'WAITLIST' };
    const secondWaitlist = {
      id: 6,
      eventId: 1,
      userId: 11,
      status: 'WAITLIST',
    };

    mockedAttendeeDao.findEarliestWaitlist
      .mockResolvedValueOnce(firstWaitlist)
      .mockResolvedValueOnce(secondWaitlist)
      .mockResolvedValueOnce(null);
    mockedAttendeeDao.updateAttendeeStatus.mockResolvedValue({
      ...firstWaitlist,
      status: 'CONFIRMED',
    });
    mockedAttendeeDao.incrementAttendeeCount.mockResolvedValue({});
    mockedAttendeeDao.createAuditLog.mockResolvedValue({});

    // First promotion
    await eventAttendeeService.promoteFromWaitlist(1, mockTx);
    expect(mockedAttendeeDao.findEarliestWaitlist).toHaveBeenCalledTimes(1);

    // Second promotion
    mockedAttendeeDao.updateAttendeeStatus.mockResolvedValue({
      ...secondWaitlist,
      status: 'CONFIRMED',
    });
    await eventAttendeeService.promoteFromWaitlist(1, mockTx);
    expect(mockedAttendeeDao.updateAttendeeStatus).toHaveBeenLastCalledWith(
      6,
      'CONFIRMED',
      mockTx
    );

    // Third call — no waitlist left
    await eventAttendeeService.promoteFromWaitlist(1, mockTx);
    expect(mockedAttendeeDao.findEarliestWaitlist).toHaveBeenCalledTimes(3);
  });
});
