import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as eventAttendeeService from './service.js';
import * as attendeeDao from './dao.js';
const mockedAttendeeDao = vi.mocked(attendeeDao);
import type { Prisma } from '@prisma/client';
import {
  attendeeRow,
  attendeeWithUserRow,
  auditLogRow,
  eventCapacityRow,
  eventRow,
} from './rsvp-fixtures.js';

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
  const mockEvent = eventCapacityRow({ id: 1, capacity: 10, attendeeCount: 5 });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('register creates audit log with previousStatus null (new registration)', async () => {
    mockedAttendeeDao.findEventById.mockResolvedValue(mockEvent);
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(null);
    mockedAttendeeDao.countConfirmedAttendees.mockResolvedValue(4);
    mockedAttendeeDao.updateEventAttendeeCountWithLock.mockResolvedValue(1);
    mockedAttendeeDao.createAttendee.mockResolvedValue(
      attendeeRow({ id: 1, userId: 1 })
    );
    mockedAttendeeDao.createAuditLog.mockResolvedValue(auditLogRow());

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
    const cancelledAttendee = attendeeRow({
      id: 1,
      userId: 1,
      status: 'CANCELLED',
    });
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
    mockedAttendeeDao.createAuditLog.mockResolvedValue(auditLogRow());

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
    const confirmedAttendee = attendeeRow({ id: 1, userId: 1 });
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(
      confirmedAttendee
    );
    mockedAttendeeDao.updateAttendeeStatus.mockResolvedValue({
      ...confirmedAttendee,
      status: 'CANCELLED',
    });
    mockedAttendeeDao.decrementAttendeeCount.mockResolvedValue(eventRow());
    mockedAttendeeDao.createAuditLog.mockResolvedValue(auditLogRow());
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
    const waitlistAttendee = attendeeWithUserRow({
      id: 1,
      userId: 5,
      status: 'WAITLIST',
    });
    mockedAttendeeDao.findAttendeeById.mockResolvedValue(waitlistAttendee);
    mockedAttendeeDao.findEventById.mockResolvedValue(mockEvent);
    mockedAttendeeDao.countConfirmedAttendees.mockResolvedValue(5);
    mockedAttendeeDao.updateAttendeeStatus.mockResolvedValue({
      ...waitlistAttendee,
      status: 'CONFIRMED',
    });
    mockedAttendeeDao.incrementAttendeeCount.mockResolvedValue(eventRow());
    mockedAttendeeDao.createAuditLog.mockResolvedValue(auditLogRow());

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
    mockedAttendeeDao.findEarliestWaitlist.mockResolvedValue(
      attendeeRow({ id: 5, userId: 10, status: 'WAITLIST' })
    );
    mockedAttendeeDao.updateAttendeeStatus.mockResolvedValue(
      attendeeRow({ id: 5, userId: 10 })
    );
    mockedAttendeeDao.incrementAttendeeCount.mockResolvedValue(eventRow());
    mockedAttendeeDao.createAuditLog.mockResolvedValue(auditLogRow());

    await eventAttendeeService.promoteFromWaitlist(
      1,
      {} as Prisma.TransactionClient
    );

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
