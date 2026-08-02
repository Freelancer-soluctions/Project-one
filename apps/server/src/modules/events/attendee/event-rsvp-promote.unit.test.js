import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as eventAttendeeService from './service.js';
import * as attendeeDao from './dao.js';

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
    attendeeDao.findEarliestWaitlist.mockResolvedValue(null);
    const result = await eventAttendeeService.promoteFromWaitlist(1, mockTx);
    expect(result).toBeNull();
    expect(attendeeDao.updateAttendeeStatus).not.toHaveBeenCalled();
  });

  it('promotes earliest waitlisted attendee to CONFIRMED', async () => {
    attendeeDao.findEarliestWaitlist.mockResolvedValue(mockWaitlist);
    attendeeDao.updateAttendeeStatus.mockResolvedValue(mockPromoted);
    attendeeDao.incrementAttendeeCount.mockResolvedValue({});
    attendeeDao.createAuditLog.mockResolvedValue({});

    const result = await eventAttendeeService.promoteFromWaitlist(1, mockTx);

    expect(attendeeDao.findEarliestWaitlist).toHaveBeenCalledWith(1, mockTx);
    expect(attendeeDao.updateAttendeeStatus).toHaveBeenCalledWith(
      5,
      'CONFIRMED',
      mockTx
    );
    expect(attendeeDao.incrementAttendeeCount).toHaveBeenCalledWith(1, mockTx);
    expect(attendeeDao.createAuditLog).toHaveBeenCalledWith(
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
    attendeeDao.findEarliestWaitlist.mockResolvedValue(mockWaitlist);
    attendeeDao.updateAttendeeStatus.mockResolvedValue(mockPromoted);
    attendeeDao.incrementAttendeeCount.mockResolvedValue({});
    attendeeDao.createAuditLog.mockResolvedValue({});

    await eventAttendeeService.promoteFromWaitlist(1, mockTx);

    // All DAO calls should receive the same tx
    expect(attendeeDao.updateAttendeeStatus.mock.calls[0][2]).toBe(mockTx);
    expect(attendeeDao.incrementAttendeeCount.mock.calls[0][1]).toBe(mockTx);
    expect(attendeeDao.createAuditLog.mock.calls[0][1]).toBe(mockTx);
  });

  it('creates multiple promoted entries when called repeatedly (FIFO chain)', async () => {
    const firstWaitlist = { id: 5, eventId: 1, userId: 10, status: 'WAITLIST' };
    const secondWaitlist = {
      id: 6,
      eventId: 1,
      userId: 11,
      status: 'WAITLIST',
    };

    attendeeDao.findEarliestWaitlist
      .mockResolvedValueOnce(firstWaitlist)
      .mockResolvedValueOnce(secondWaitlist)
      .mockResolvedValueOnce(null);
    attendeeDao.updateAttendeeStatus.mockResolvedValue({
      ...firstWaitlist,
      status: 'CONFIRMED',
    });
    attendeeDao.incrementAttendeeCount.mockResolvedValue({});
    attendeeDao.createAuditLog.mockResolvedValue({});

    // First promotion
    await eventAttendeeService.promoteFromWaitlist(1, mockTx);
    expect(attendeeDao.findEarliestWaitlist).toHaveBeenCalledTimes(1);

    // Second promotion
    attendeeDao.updateAttendeeStatus.mockResolvedValue({
      ...secondWaitlist,
      status: 'CONFIRMED',
    });
    await eventAttendeeService.promoteFromWaitlist(1, mockTx);
    expect(attendeeDao.updateAttendeeStatus).toHaveBeenLastCalledWith(
      6,
      'CONFIRMED',
      mockTx
    );

    // Third call — no waitlist left
    await eventAttendeeService.promoteFromWaitlist(1, mockTx);
    expect(attendeeDao.findEarliestWaitlist).toHaveBeenCalledTimes(3);
  });
});
