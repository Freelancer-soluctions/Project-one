import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as eventAttendeeService from './service.js';
import * as attendeeDao from './dao.js';
import * as stateMachine from '../stateMachine.js';

vi.mock('./dao.js', () => ({
  findAttendeeById: vi.fn(),
  findEventById: vi.fn(),
  countConfirmedAttendees: vi.fn(),
  updateAttendeeStatus: vi.fn(),
  decrementAttendeeCount: vi.fn(),
  incrementAttendeeCount: vi.fn(),
  createAuditLog: vi.fn(),
  findEarliestWaitlist: vi.fn(),
}));

vi.mock('../stateMachine.js', () => ({
  canTransition: vi.fn(() => true),
  getAllowedNextStates: vi.fn(() => []),
}));

vi.mock('../../../config/db.js', () => ({
  prisma: {
    $transaction: vi.fn((cb) => cb({})),
  },
  Prisma: {},
}));

describe('Event RSVP — admin updateAttendeeStatus', () => {
  const mockAttendee = { id: 1, eventId: 1, userId: 5, status: 'WAITLIST' };
  const mockEvent = { id: 1, capacity: 10, attendeeCount: 10 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws 404 if attendee not found', async () => {
    attendeeDao.findAttendeeById.mockResolvedValue(null);
    await expect(eventAttendeeService.updateAttendeeStatus(999, 'CONFIRMED', 1))
      .rejects.toThrow('Attendee not found');
  });

  it('throws 409 if attendee already has target status', async () => {
    attendeeDao.findAttendeeById.mockResolvedValue({ ...mockAttendee, status: 'CONFIRMED' });
    await expect(eventAttendeeService.updateAttendeeStatus(1, 'CONFIRMED', 1))
      .rejects.toThrow('Attendee already has status CONFIRMED');
  });

  it('throws 400 if invalid transition', async () => {
    stateMachine.canTransition.mockReturnValue(false);
    attendeeDao.findAttendeeById.mockResolvedValue(mockAttendee);
    await expect(eventAttendeeService.updateAttendeeStatus(1, 'CANCELLED', 1))
      .rejects.toThrow('Cannot transition from WAITLIST to CANCELLED');
  });

  it('throws 409 when promoting to CONFIRMED at capacity', async () => {
    stateMachine.canTransition.mockReturnValue(true);
    attendeeDao.findAttendeeById.mockResolvedValue(mockAttendee);
    attendeeDao.findEventById.mockResolvedValue(mockEvent);
    attendeeDao.countConfirmedAttendees.mockResolvedValue(10); // at capacity

    await expect(eventAttendeeService.updateAttendeeStatus(1, 'CONFIRMED', 1))
      .rejects.toThrow('Event at capacity');
  });

  it('promotes WAITLIST to CONFIRMED — increments count', async () => {
    stateMachine.canTransition.mockReturnValue(true);
    attendeeDao.findAttendeeById.mockResolvedValue(mockAttendee);
    attendeeDao.findEventById.mockResolvedValue(mockEvent);
    attendeeDao.countConfirmedAttendees.mockResolvedValue(5); // room available
    attendeeDao.updateAttendeeStatus.mockResolvedValue({ ...mockAttendee, status: 'CONFIRMED' });
    attendeeDao.incrementAttendeeCount.mockResolvedValue({});
    attendeeDao.createAuditLog.mockResolvedValue({});

    const result = await eventAttendeeService.updateAttendeeStatus(1, 'CONFIRMED', 1);

    expect(attendeeDao.updateAttendeeStatus).toHaveBeenCalledWith(1, 'CONFIRMED', expect.anything());
    expect(attendeeDao.incrementAttendeeCount).toHaveBeenCalledWith(1, expect.anything());
    expect(attendeeDao.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ attendeeId: 1, changedBy: 1 }),
      expect.anything()
    );
    expect(result.status).toBe('CONFIRMED');
  });

  it('changes CONFIRMED to CANCELLED — decrements count, promotes waitlist', async () => {
    const confirmedAttendee = { id: 2, eventId: 1, userId: 6, status: 'CONFIRMED' };
    stateMachine.canTransition.mockReturnValue(true);
    attendeeDao.findAttendeeById.mockResolvedValue(confirmedAttendee);
    attendeeDao.updateAttendeeStatus.mockResolvedValue({ ...confirmedAttendee, status: 'CANCELLED' });
    attendeeDao.decrementAttendeeCount.mockResolvedValue({});
    attendeeDao.createAuditLog.mockResolvedValue({});
    attendeeDao.findEarliestWaitlist.mockResolvedValue(null);

    const result = await eventAttendeeService.updateAttendeeStatus(2, 'CANCELLED', 1);

    expect(attendeeDao.decrementAttendeeCount).toHaveBeenCalledWith(1, expect.anything());
    expect(attendeeDao.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ previousStatus: 'CONFIRMED', newStatus: 'CANCELLED', changedBy: 1 }),
      expect.anything()
    );
    expect(result.status).toBe('CANCELLED');
  });

  it('changes CONFIRMED to CANCELLED with waitlist — triggers promotion', async () => {
    const confirmedAttendee = { id: 2, eventId: 1, userId: 6, status: 'CONFIRMED' };
    const waitlistAttendee = { id: 10, eventId: 1, userId: 20, status: 'WAITLIST' };
    stateMachine.canTransition.mockReturnValue(true);
    attendeeDao.findAttendeeById.mockResolvedValue(confirmedAttendee);
    attendeeDao.updateAttendeeStatus
      .mockResolvedValueOnce({ ...confirmedAttendee, status: 'CANCELLED' })
      .mockResolvedValueOnce({ ...waitlistAttendee, status: 'CONFIRMED' });
    attendeeDao.decrementAttendeeCount.mockResolvedValue({});
    attendeeDao.createAuditLog.mockResolvedValue({});
    attendeeDao.findEarliestWaitlist.mockResolvedValue(waitlistAttendee);
    attendeeDao.incrementAttendeeCount.mockResolvedValue({});

    await eventAttendeeService.updateAttendeeStatus(2, 'CANCELLED', 1);

    expect(attendeeDao.updateAttendeeStatus).toHaveBeenCalledTimes(2);
    expect(attendeeDao.decrementAttendeeCount).toHaveBeenCalled();
    expect(attendeeDao.incrementAttendeeCount).toHaveBeenCalled();
  });
});