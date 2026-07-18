import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as eventAttendeeService from '../../src/modules/events/attendee/service.js';
import * as attendeeDao from '../../src/modules/events/attendee/dao.js';
import * as stateMachine from '../../src/modules/events/stateMachine.js';

vi.mock('../../src/modules/events/attendee/dao.js', () => ({
  findEventById: vi.fn(),
  findAttendeeByUserAndEvent: vi.fn(),
  countConfirmedAttendees: vi.fn(),
  createAttendee: vi.fn(),
  updateAttendeeStatus: vi.fn(),
  incrementAttendeeCount: vi.fn(),
  updateEventAttendeeCountWithLock: vi.fn(),
  createAuditLog: vi.fn(),
}));

vi.mock('../../src/modules/events/stateMachine.js', () => ({
  canTransition: vi.fn(() => true),
  getAllowedNextStates: vi.fn(() => []),
}));

vi.mock('../../src/config/db.js', () => ({
  prisma: {
    $transaction: vi.fn((cb) => cb({})),
  },
  Prisma: {},
}));

describe('Event RSVP — register', () => {
  const mockEvent = { id: 1, capacity: 10, attendeeCount: 5, eventDate: '2099-06-30' };
  const mockPastEvent = { id: 2, capacity: 10, attendeeCount: 0, eventDate: '2020-01-01' };
  const mockUnlimitedEvent = { id: 3, capacity: 0, attendeeCount: 0, eventDate: '2099-06-30' };
  const mockAttendee = { id: 1, eventId: 1, userId: 1, status: 'CONFIRMED' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws 404 if event not found', async () => {
    attendeeDao.findEventById.mockResolvedValue(null);
    await expect(eventAttendeeService.register(999, 1)).rejects.toThrow('Event not found');
  });

  it('throws 400 if event is in the past', async () => {
    attendeeDao.findEventById.mockResolvedValue(mockPastEvent);
    await expect(eventAttendeeService.register(2, 1)).rejects.toThrow('Cannot register for past events');
  });

  it('returns existing attendee if already registered (CONFIRMED) — idempotent', async () => {
    const existingAttendee = { id: 1, eventId: 1, userId: 1, status: 'CONFIRMED' };
    attendeeDao.findEventById.mockResolvedValue(mockEvent);
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(existingAttendee);
    const result = await eventAttendeeService.register(1, 1);
    expect(result).toEqual(existingAttendee);
    expect(attendeeDao.createAttendee).not.toHaveBeenCalled();
  });

  it('returns existing attendee if already registered (WAITLIST) — idempotent', async () => {
    const existingAttendee = { id: 2, eventId: 1, userId: 2, status: 'WAITLIST' };
    attendeeDao.findEventById.mockResolvedValue(mockEvent);
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(existingAttendee);
    const result = await eventAttendeeService.register(1, 2);
    expect(result).toEqual(existingAttendee);
    expect(attendeeDao.createAttendee).not.toHaveBeenCalled();
  });

  it('creates CONFIRMED when capacity = 0 (unlimited)', async () => {
    attendeeDao.findEventById.mockResolvedValue(mockUnlimitedEvent);
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(null);
    attendeeDao.createAttendee.mockResolvedValue({ id: 1, eventId: 3, userId: 1, status: 'CONFIRMED' });
    attendeeDao.incrementAttendeeCount.mockResolvedValue({});
    attendeeDao.createAuditLog.mockResolvedValue({});

    const result = await eventAttendeeService.register(3, 1);

    expect(attendeeDao.createAttendee).toHaveBeenCalledWith(
      { eventId: 3, userId: 1, status: 'CONFIRMED' },
      expect.anything()
    );
    expect(attendeeDao.incrementAttendeeCount).toHaveBeenCalledWith(3, expect.anything());
    expect(attendeeDao.createAuditLog).toHaveBeenCalled();
    expect(result.status).toBe('CONFIRMED');
  });

  it('creates CONFIRMED when capacity available', async () => {
    attendeeDao.findEventById.mockResolvedValue(mockEvent);
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(null);
    attendeeDao.countConfirmedAttendees.mockResolvedValue(4); // 4 < 10
    attendeeDao.updateEventAttendeeCountWithLock.mockResolvedValue(1); // lock succeeds
    attendeeDao.createAttendee.mockResolvedValue({ id: 2, eventId: 1, userId: 1, status: 'CONFIRMED' });
    attendeeDao.createAuditLog.mockResolvedValue({});

    const result = await eventAttendeeService.register(1, 1);

    expect(attendeeDao.createAttendee).toHaveBeenCalledWith(
      { eventId: 1, userId: 1, status: 'CONFIRMED' },
      expect.anything()
    );
    expect(attendeeDao.updateEventAttendeeCountWithLock).toHaveBeenCalledWith(1, 5, expect.anything());
    expect(result.status).toBe('CONFIRMED');
  });

  it('creates WAITLIST when at capacity', async () => {
    attendeeDao.findEventById.mockResolvedValue(mockEvent);
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(null);
    attendeeDao.countConfirmedAttendees.mockResolvedValue(10); // 10 >= 10
    attendeeDao.createAttendee.mockResolvedValue({ id: 3, eventId: 1, userId: 1, status: 'WAITLIST' });
    attendeeDao.createAuditLog.mockResolvedValue({});

    const result = await eventAttendeeService.register(1, 1);

    expect(attendeeDao.createAttendee).toHaveBeenCalledWith(
      { eventId: 1, userId: 1, status: 'WAITLIST' },
      expect.anything()
    );
    expect(result.status).toBe('WAITLIST');
  });

  it('switches to WAITLIST when optimistic lock fails (race condition)', async () => {
    attendeeDao.findEventById.mockResolvedValue(mockEvent);
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(null);
    attendeeDao.countConfirmedAttendees.mockResolvedValue(9); // 9 < 10, so target = CONFIRMED
    attendeeDao.updateEventAttendeeCountWithLock.mockResolvedValue(0); // lock fails
    attendeeDao.createAttendee.mockResolvedValue({ id: 4, eventId: 1, userId: 1, status: 'WAITLIST' });
    attendeeDao.createAuditLog.mockResolvedValue({});

    const result = await eventAttendeeService.register(1, 1);

    expect(attendeeDao.createAttendee).toHaveBeenCalledWith(
      { eventId: 1, userId: 1, status: 'WAITLIST' },
      expect.anything()
    );
    expect(result.status).toBe('WAITLIST');
  });

  it('re-registers from CANCELLED status (update instead of create)', async () => {
    const cancelledAttendee = { id: 5, eventId: 1, userId: 1, status: 'CANCELLED' };
    attendeeDao.findEventById.mockResolvedValue(mockEvent);
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(cancelledAttendee);
    attendeeDao.countConfirmedAttendees.mockResolvedValue(4);
    attendeeDao.updateEventAttendeeCountWithLock.mockResolvedValue(1);
    attendeeDao.updateAttendeeStatus.mockResolvedValue({ ...cancelledAttendee, status: 'CONFIRMED' });
    attendeeDao.createAuditLog.mockResolvedValue({});

    const result = await eventAttendeeService.register(1, 1);

    expect(attendeeDao.updateAttendeeStatus).toHaveBeenCalledWith(5, 'CONFIRMED', expect.anything());
    expect(attendeeDao.createAttendee).not.toHaveBeenCalled();
    expect(result.status).toBe('CONFIRMED');
  });
});