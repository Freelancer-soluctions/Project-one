import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as eventAttendeeService from './service.js';
import * as attendeeDao from './dao.js';
const mockedAttendeeDao = vi.mocked(attendeeDao);
import {
  attendeeRow,
  auditLogRow,
  eventCapacityRow,
  eventRow,
} from './rsvp-fixtures.js';

vi.mock('./dao.js', () => ({
  findEventById: vi.fn(),
  findAttendeeByUserAndEvent: vi.fn(),
  countConfirmedAttendees: vi.fn(),
  createAttendee: vi.fn(),
  updateAttendeeStatus: vi.fn(),
  incrementAttendeeCount: vi.fn(),
  updateEventAttendeeCountWithLock: vi.fn(),
  createAuditLog: vi.fn(),
}));

vi.mock('../../../config/db.js', () => ({
  prisma: {
    $transaction: vi.fn((cb) => cb({})),
  },
  Prisma: {},
}));

describe('Event RSVP — register', () => {
  const mockEvent = eventCapacityRow({ id: 1, capacity: 10, attendeeCount: 5 });
  const mockPastEvent = eventCapacityRow({
    id: 2,
    capacity: 10,
    attendeeCount: 0,
    eventDate: new Date('2020-01-01T00:00:00.000Z'),
  });
  const mockUnlimitedEvent = eventCapacityRow({
    id: 3,
    capacity: 0,
    attendeeCount: 0,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws 404 if event not found', async () => {
    mockedAttendeeDao.findEventById.mockResolvedValue(null);
    await expect(eventAttendeeService.register(999, 1)).rejects.toThrow(
      'Event not found'
    );
  });

  it('throws 400 if event is in the past', async () => {
    mockedAttendeeDao.findEventById.mockResolvedValue(mockPastEvent);
    await expect(eventAttendeeService.register(2, 1)).rejects.toThrow(
      'Cannot register for past events'
    );
  });

  it('returns existing attendee if already registered (CONFIRMED) — idempotent', async () => {
    const existingAttendee = attendeeRow({ id: 1, userId: 1 });
    mockedAttendeeDao.findEventById.mockResolvedValue(mockEvent);
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(
      existingAttendee
    );
    const result = await eventAttendeeService.register(1, 1);
    expect(result).toEqual(existingAttendee);
    expect(mockedAttendeeDao.createAttendee).not.toHaveBeenCalled();
  });

  it('returns existing attendee if already registered (WAITLIST) — idempotent', async () => {
    const existingAttendee = attendeeRow({
      id: 2,
      userId: 2,
      status: 'WAITLIST',
    });
    mockedAttendeeDao.findEventById.mockResolvedValue(mockEvent);
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(
      existingAttendee
    );
    const result = await eventAttendeeService.register(1, 2);
    expect(result).toEqual(existingAttendee);
    expect(mockedAttendeeDao.createAttendee).not.toHaveBeenCalled();
  });

  it('creates CONFIRMED when capacity = 0 (unlimited)', async () => {
    mockedAttendeeDao.findEventById.mockResolvedValue(mockUnlimitedEvent);
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(null);
    mockedAttendeeDao.createAttendee.mockResolvedValue(
      attendeeRow({ id: 1, eventId: 3, userId: 1 })
    );
    mockedAttendeeDao.incrementAttendeeCount.mockResolvedValue(eventRow());
    mockedAttendeeDao.createAuditLog.mockResolvedValue(auditLogRow());

    const result = await eventAttendeeService.register(3, 1);

    expect(mockedAttendeeDao.createAttendee).toHaveBeenCalledWith(
      { eventId: 3, userId: 1, status: 'CONFIRMED' },
      expect.anything()
    );
    expect(mockedAttendeeDao.incrementAttendeeCount).toHaveBeenCalledWith(
      3,
      expect.anything()
    );
    expect(mockedAttendeeDao.createAuditLog).toHaveBeenCalled();
    expect(result.status).toBe('CONFIRMED');
  });

  it('creates CONFIRMED when capacity available', async () => {
    mockedAttendeeDao.findEventById.mockResolvedValue(mockEvent);
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(null);
    mockedAttendeeDao.countConfirmedAttendees.mockResolvedValue(4); // 4 < 10
    mockedAttendeeDao.updateEventAttendeeCountWithLock.mockResolvedValue(1); // lock succeeds
    mockedAttendeeDao.createAttendee.mockResolvedValue(
      attendeeRow({ id: 2, userId: 1 })
    );
    mockedAttendeeDao.createAuditLog.mockResolvedValue(auditLogRow());

    const result = await eventAttendeeService.register(1, 1);

    expect(mockedAttendeeDao.createAttendee).toHaveBeenCalledWith(
      { eventId: 1, userId: 1, status: 'CONFIRMED' },
      expect.anything()
    );
    expect(
      mockedAttendeeDao.updateEventAttendeeCountWithLock
    ).toHaveBeenCalledWith(1, 5, expect.anything());
    expect(result.status).toBe('CONFIRMED');
  });

  it('creates WAITLIST when at capacity', async () => {
    mockedAttendeeDao.findEventById.mockResolvedValue(mockEvent);
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(null);
    mockedAttendeeDao.countConfirmedAttendees.mockResolvedValue(10); // 10 >= 10
    mockedAttendeeDao.createAttendee.mockResolvedValue(
      attendeeRow({ id: 3, userId: 1, status: 'WAITLIST' })
    );
    mockedAttendeeDao.createAuditLog.mockResolvedValue(auditLogRow());

    const result = await eventAttendeeService.register(1, 1);

    expect(mockedAttendeeDao.createAttendee).toHaveBeenCalledWith(
      { eventId: 1, userId: 1, status: 'WAITLIST' },
      expect.anything()
    );
    expect(result.status).toBe('WAITLIST');
  });

  it('switches to WAITLIST when optimistic lock fails (race condition)', async () => {
    mockedAttendeeDao.findEventById.mockResolvedValue(mockEvent);
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(null);
    mockedAttendeeDao.countConfirmedAttendees.mockResolvedValue(9); // 9 < 10, so target = CONFIRMED
    mockedAttendeeDao.updateEventAttendeeCountWithLock.mockResolvedValue(0); // lock fails
    mockedAttendeeDao.createAttendee.mockResolvedValue(
      attendeeRow({ id: 4, userId: 1, status: 'WAITLIST' })
    );
    mockedAttendeeDao.createAuditLog.mockResolvedValue(auditLogRow());

    const result = await eventAttendeeService.register(1, 1);

    expect(mockedAttendeeDao.createAttendee).toHaveBeenCalledWith(
      { eventId: 1, userId: 1, status: 'WAITLIST' },
      expect.anything()
    );
    expect(result.status).toBe('WAITLIST');
  });

  it('re-registers from CANCELLED status (update instead of create)', async () => {
    const cancelledAttendee = attendeeRow({
      id: 5,
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

    const result = await eventAttendeeService.register(1, 1);

    expect(mockedAttendeeDao.updateAttendeeStatus).toHaveBeenCalledWith(
      5,
      'CONFIRMED',
      expect.anything()
    );
    expect(mockedAttendeeDao.createAttendee).not.toHaveBeenCalled();
    expect(result.status).toBe('CONFIRMED');
  });
});
