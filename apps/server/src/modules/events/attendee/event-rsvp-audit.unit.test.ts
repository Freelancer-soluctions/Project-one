import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as eventAttendeeService from './service.js';
import * as attendeeDao from './dao.js';
const mockedAttendeeDao = vi.mocked(attendeeDao);

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
    mockedAttendeeDao.findEventById.mockResolvedValue(mockEvent);
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(null);
    mockedAttendeeDao.countConfirmedAttendees.mockResolvedValue(4);
    mockedAttendeeDao.updateEventAttendeeCountWithLock.mockResolvedValue(1);
    mockedAttendeeDao.createAttendee.mockResolvedValue({
      id: 1,
      eventId: 1,
      userId: 1,
      status: 'CONFIRMED',
    });
    mockedAttendeeDao.createAuditLog.mockResolvedValue({});

    await eventAttendeeService.register(1, 1);

    expect(mockedAttendeeDao.createAuditLog).toHaveBeenCalledWith(
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
    mockedAttendeeDao.findEventById.mockResolvedValue(mockEvent);
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(
      cancelledAttendee
    );
    mockedAttendeeDao.countConfirmedAttendees.mockResolvedValue(4);
    mockedAttendeeDao.updateEventAttendeeCountWithLock.mockResolvedValue(1);
    mockedAttendeeDao.updateAttendeeStatus.mockResolvedValue({
      ...cancelledAttendee,
      status: 'CONFIRMED',
    });
    mockedAttendeeDao.createAuditLog.mockResolvedValue({});

    await eventAttendeeService.register(1, 1);

    expect(mockedAttendeeDao.createAuditLog).toHaveBeenCalledWith(
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
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(
      confirmedAttendee
    );
    mockedAttendeeDao.updateAttendeeStatus.mockResolvedValue({
      ...confirmedAttendee,
      status: 'CANCELLED',
    });
    mockedAttendeeDao.decrementAttendeeCount.mockResolvedValue({});
    mockedAttendeeDao.createAuditLog.mockResolvedValue({});
    mockedAttendeeDao.findEarliestWaitlist.mockResolvedValue(null);

    await eventAttendeeService.cancel(1, 1);

    expect(mockedAttendeeDao.createAuditLog).toHaveBeenCalledWith(
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
    mockedAttendeeDao.findAttendeeById.mockResolvedValue(waitlistAttendee);
    mockedAttendeeDao.findEventById.mockResolvedValue(mockEvent);
    mockedAttendeeDao.countConfirmedAttendees.mockResolvedValue(5);
    mockedAttendeeDao.updateAttendeeStatus.mockResolvedValue({
      ...waitlistAttendee,
      status: 'CONFIRMED',
    });
    mockedAttendeeDao.incrementAttendeeCount.mockResolvedValue({});
    mockedAttendeeDao.createAuditLog.mockResolvedValue({});

    await eventAttendeeService.updateAttendeeStatus(1, 'CONFIRMED', 99);

    expect(mockedAttendeeDao.createAuditLog).toHaveBeenCalledWith(
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
    mockedAttendeeDao.findEarliestWaitlist.mockResolvedValue({
      id: 5,
      eventId: 1,
      userId: 10,
      status: 'WAITLIST',
    });
    mockedAttendeeDao.updateAttendeeStatus.mockResolvedValue({
      id: 5,
      eventId: 1,
      userId: 10,
      status: 'CONFIRMED',
    });
    mockedAttendeeDao.incrementAttendeeCount.mockResolvedValue({});
    mockedAttendeeDao.createAuditLog.mockResolvedValue({});

    await eventAttendeeService.promoteFromWaitlist(1, {});

    expect(mockedAttendeeDao.createAuditLog).toHaveBeenCalledWith(
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
