import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as eventAttendeeService from '../../src/modules/events/attendee/service.js';
import * as attendeeDao from '../../src/modules/events/attendee/dao.js';
import * as stateMachine from '../../src/modules/events/stateMachine.js';

vi.mock('../../src/modules/events/attendee/dao.js', () => ({
  findEventById: vi.fn(),
  findAttendeeByUserAndEvent: vi.fn(),
  updateAttendeeStatus: vi.fn(),
  decrementAttendeeCount: vi.fn(),
  createAuditLog: vi.fn(),
  findEarliestWaitlist: vi.fn(),
  incrementAttendeeCount: vi.fn(),
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

describe('Event RSVP — cancel', () => {
  const mockConfirmed = { id: 1, eventId: 1, userId: 1, status: 'CONFIRMED' };
  const mockWaitlist = { id: 2, eventId: 1, userId: 2, status: 'WAITLIST' };
  const mockCancelled = { id: 3, eventId: 1, userId: 3, status: 'CANCELLED' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws 404 if registration not found', async () => {
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(null);
    await expect(eventAttendeeService.cancel(1, 999)).rejects.toThrow('Registration not found');
  });

  it('throws 409 if already cancelled', async () => {
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(mockCancelled);
    await expect(eventAttendeeService.cancel(1, 3)).rejects.toThrow('Registration already cancelled');
  });

  it('throws 400 if invalid transition', async () => {
    stateMachine.canTransition.mockReturnValue(false);
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(mockConfirmed);
    await expect(eventAttendeeService.cancel(1, 1)).rejects.toThrow('Cannot cancel from CONFIRMED status');
  });

  it('cancels CONFIRMED — decrements count, promotes waitlist', async () => {
    stateMachine.canTransition.mockReturnValue(true);
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(mockConfirmed);
    attendeeDao.updateAttendeeStatus.mockResolvedValue({ ...mockConfirmed, status: 'CANCELLED' });
    attendeeDao.decrementAttendeeCount.mockResolvedValue({});
    attendeeDao.createAuditLog.mockResolvedValue({});
    attendeeDao.findEarliestWaitlist.mockResolvedValue(null);

    const result = await eventAttendeeService.cancel(1, 1);

    expect(attendeeDao.updateAttendeeStatus).toHaveBeenCalledWith(1, 'CANCELLED', expect.anything());
    expect(attendeeDao.decrementAttendeeCount).toHaveBeenCalledWith(1, expect.anything());
    expect(attendeeDao.createAuditLog).toHaveBeenCalled();
    expect(result.status).toBe('CANCELLED');
  });

  it('cancels WAITLIST — no count decrement, no waitlist promotion', async () => {
    stateMachine.canTransition.mockReturnValue(true);
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(mockWaitlist);
    attendeeDao.updateAttendeeStatus.mockResolvedValue({ ...mockWaitlist, status: 'CANCELLED' });
    attendeeDao.createAuditLog.mockResolvedValue({});

    const result = await eventAttendeeService.cancel(1, 2);

    expect(attendeeDao.updateAttendeeStatus).toHaveBeenCalledWith(2, 'CANCELLED', expect.anything());
    expect(attendeeDao.decrementAttendeeCount).not.toHaveBeenCalled();
    expect(attendeeDao.findEarliestWaitlist).not.toHaveBeenCalled();
    expect(attendeeDao.createAuditLog).toHaveBeenCalled();
    expect(result.status).toBe('CANCELLED');
  });

  it('promotes first waitlisted when cancelling CONFIRMED with waitlist', async () => {
    const waitlistUser = { id: 10, eventId: 1, userId: 10, status: 'WAITLIST' };
    stateMachine.canTransition.mockReturnValue(true);
    attendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(mockConfirmed);
    attendeeDao.updateAttendeeStatus
      .mockResolvedValueOnce({ ...mockConfirmed, status: 'CANCELLED' }) // cancel
      .mockResolvedValueOnce({ ...waitlistUser, status: 'CONFIRMED' }); // promote
    attendeeDao.decrementAttendeeCount.mockResolvedValue({});
    attendeeDao.createAuditLog.mockResolvedValue({});
    attendeeDao.findEarliestWaitlist.mockResolvedValue(waitlistUser);
    attendeeDao.incrementAttendeeCount.mockResolvedValue({});

    await eventAttendeeService.cancel(1, 1);

    // updateAttendeeStatus called twice: cancel + promote
    expect(attendeeDao.updateAttendeeStatus).toHaveBeenCalledTimes(2);
    expect(attendeeDao.updateAttendeeStatus).toHaveBeenNthCalledWith(1, 1, 'CANCELLED', expect.anything());
    expect(attendeeDao.updateAttendeeStatus).toHaveBeenNthCalledWith(2, 10, 'CONFIRMED', expect.anything());
    expect(attendeeDao.decrementAttendeeCount).toHaveBeenCalledWith(1, expect.anything());
    expect(attendeeDao.incrementAttendeeCount).toHaveBeenCalledWith(1, expect.anything());
  });
});