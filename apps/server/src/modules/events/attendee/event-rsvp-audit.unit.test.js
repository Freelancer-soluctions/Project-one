import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as eventAttendeeService from './service.js';
import * as attendeeDao from './dao.js';

vi.mock('./dao.js', () => ({
  findEventById: vi.fn(),
  findAttendeeByUserAndEvent: vi.fn(),
  findAttendeeById: vi.fn(),
  countConfirmedAttendees: vi.fn(),
  createAttendee: vi.fn(),
  updateAttendeeStatus: vi.fn(),
  incrementAttendeeCount: vi.fn(),
  decrementAttendeeCount: vi.fn(),
  updateEventAttendeeCountWithLock: vi.fn(),
  createAuditLog: vi.fn(),
  findEarliestWaitlist: vi.fn(),
}));

vi.mock('../../../config/db.js', () => ({
  prisma: {
    $transaction: vi.fn((cb) => cb({})),
  },
  Prisma: {},
}));

describe('Event RSVP — audit log', () => {
  const mockEvent = {
    id: 1,
    capacity: 10,
    attendeeCount: 5,
    eventDate: '2099-06-30',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('register creates audit log with previousStatus null (new registration)', async () => {
    attendeeDao.findEventById.mockResolvedValue(mockEvent);
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(null);
    attendeeDao.countConfirmedAttendees.mockResolvedValue(4);
    attendeeDao.updateEventAttendeeCountWithLock.mockResolvedValue(1);
    attendeeDao.createAttendee.mockResolvedValue({
      id: 1,
      eventId: 1,
      userId: 1,
      status: 'CONFIRMED',
    });
    attendeeDao.createAuditLog.mockResolvedValue({});

    await eventAttendeeService.register(1, 1);

    expect(attendeeDao.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        attendeeId: 1,
        eventId: 1,
        previousStatus: null,
        newStatus: 'CONFIRMED',
        changedBy: 1,
      }),
      expect.anything()
    );
  });

  it('register creates audit log with previousStatus=CANCELLED (re-registration)', async () => {
    const cancelledAttendee = {
      id: 1,
      eventId: 1,
      userId: 1,
      status: 'CANCELLED',
    };
    attendeeDao.findEventById.mockResolvedValue(mockEvent);
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(cancelledAttendee);
    attendeeDao.countConfirmedAttendees.mockResolvedValue(4);
    attendeeDao.updateEventAttendeeCountWithLock.mockResolvedValue(1);
    attendeeDao.updateAttendeeStatus.mockResolvedValue({
      ...cancelledAttendee,
      status: 'CONFIRMED',
    });
    attendeeDao.createAuditLog.mockResolvedValue({});

    await eventAttendeeService.register(1, 1);

    expect(attendeeDao.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        attendeeId: 1,
        previousStatus: 'CANCELLED',
        newStatus: 'CONFIRMED',
        changedBy: 1,
      }),
      expect.anything()
    );
  });

  it('cancel creates audit log', async () => {
    const confirmedAttendee = {
      id: 1,
      eventId: 1,
      userId: 1,
      status: 'CONFIRMED',
    };
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(confirmedAttendee);
    attendeeDao.updateAttendeeStatus.mockResolvedValue({
      ...confirmedAttendee,
      status: 'CANCELLED',
    });
    attendeeDao.decrementAttendeeCount.mockResolvedValue({});
    attendeeDao.createAuditLog.mockResolvedValue({});
    attendeeDao.findEarliestWaitlist.mockResolvedValue(null);

    await eventAttendeeService.cancel(1, 1);

    expect(attendeeDao.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        attendeeId: 1,
        eventId: 1,
        previousStatus: 'CONFIRMED',
        newStatus: 'CANCELLED',
        changedBy: 1,
      }),
      expect.anything()
    );
  });

  it('admin status change creates audit log with changedBy = adminUserId', async () => {
    const waitlistAttendee = {
      id: 1,
      eventId: 1,
      userId: 5,
      status: 'WAITLIST',
    };
    attendeeDao.findAttendeeById.mockResolvedValue(waitlistAttendee);
    attendeeDao.findEventById.mockResolvedValue(mockEvent);
    attendeeDao.countConfirmedAttendees.mockResolvedValue(5);
    attendeeDao.updateAttendeeStatus.mockResolvedValue({
      ...waitlistAttendee,
      status: 'CONFIRMED',
    });
    attendeeDao.incrementAttendeeCount.mockResolvedValue({});
    attendeeDao.createAuditLog.mockResolvedValue({});

    await eventAttendeeService.updateAttendeeStatus(1, 'CONFIRMED', 99);

    expect(attendeeDao.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        attendeeId: 1,
        eventId: 1,
        previousStatus: 'WAITLIST',
        newStatus: 'CONFIRMED',
        changedBy: 99,
      }),
      expect.anything()
    );
  });

  it('promoteFromWaitlist creates audit log with changedBy = null', async () => {
    attendeeDao.findEarliestWaitlist.mockResolvedValue({
      id: 5,
      eventId: 1,
      userId: 10,
      status: 'WAITLIST',
    });
    attendeeDao.updateAttendeeStatus.mockResolvedValue({
      id: 5,
      eventId: 1,
      userId: 10,
      status: 'CONFIRMED',
    });
    attendeeDao.incrementAttendeeCount.mockResolvedValue({});
    attendeeDao.createAuditLog.mockResolvedValue({});

    await eventAttendeeService.promoteFromWaitlist(1, {});

    expect(attendeeDao.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        attendeeId: 5,
        eventId: 1,
        previousStatus: 'WAITLIST',
        newStatus: 'CONFIRMED',
        changedBy: null,
      }),
      expect.anything()
    );
  });
});
