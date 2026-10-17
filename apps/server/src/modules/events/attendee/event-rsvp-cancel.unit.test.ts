import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as eventAttendeeService from './service.js';
import * as attendeeDao from './dao.js';
const mockedAttendeeDao = vi.mocked(attendeeDao);
import * as stateMachine from '../stateMachine.js';
const mockedStateMachine = vi.mocked(stateMachine);

vi.mock('./dao.js', () => ({
  findEventById: vi.fn(),
  findAttendeeByUserAndEvent: vi.fn(),
  updateAttendeeStatus: vi.fn(),
  decrementAttendeeCount: vi.fn(),
  createAuditLog: vi.fn(),
  findEarliestWaitlist: vi.fn(),
  incrementAttendeeCount: vi.fn(),
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

describe('Event RSVP — cancel', () => {
  const mockConfirmed = { id: 1, eventId: 1, userId: 1, status: 'CONFIRMED' };
  const mockWaitlist = { id: 2, eventId: 1, userId: 2, status: 'WAITLIST' };
  const mockCancelled = { id: 3, eventId: 1, userId: 3, status: 'CANCELLED' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws 404 if registration not found', async () => {
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(null);
    await expect(eventAttendeeService.cancel(1, 999)).rejects.toThrow(
      'Registration not found'
    );
  });

  it('throws 409 if already cancelled', async () => {
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(
      mockCancelled
    );
    await expect(eventAttendeeService.cancel(1, 3)).rejects.toThrow(
      'Registration already cancelled'
    );
  });

  it('throws 400 if invalid transition', async () => {
    mockedStateMachine.canTransition.mockReturnValue(false);
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(
      mockConfirmed
    );
    await expect(eventAttendeeService.cancel(1, 1)).rejects.toThrow(
      'Cannot cancel from CONFIRMED status'
    );
  });

  it('cancels CONFIRMED — decrements count, promotes waitlist', async () => {
    mockedStateMachine.canTransition.mockReturnValue(true);
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(
      mockConfirmed
    );
    mockedAttendeeDao.updateAttendeeStatus.mockResolvedValue({
      ...mockConfirmed,
      status: 'CANCELLED',
    });
    mockedAttendeeDao.decrementAttendeeCount.mockResolvedValue({});
    mockedAttendeeDao.createAuditLog.mockResolvedValue({});
    mockedAttendeeDao.findEarliestWaitlist.mockResolvedValue(null);

    const result = await eventAttendeeService.cancel(1, 1);

    expect(mockedAttendeeDao.updateAttendeeStatus).toHaveBeenCalledWith(
      1,
      'CANCELLED',
      expect.anything()
    );
    expect(mockedAttendeeDao.decrementAttendeeCount).toHaveBeenCalledWith(
      1,
      expect.anything()
    );
    expect(mockedAttendeeDao.createAuditLog).toHaveBeenCalled();
    expect(result.status).toBe('CANCELLED');
  });

  it('cancels WAITLIST — no count decrement, no waitlist promotion', async () => {
    mockedStateMachine.canTransition.mockReturnValue(true);
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(
      mockWaitlist
    );
    mockedAttendeeDao.updateAttendeeStatus.mockResolvedValue({
      ...mockWaitlist,
      status: 'CANCELLED',
    });
    mockedAttendeeDao.createAuditLog.mockResolvedValue({});

    const result = await eventAttendeeService.cancel(1, 2);

    expect(mockedAttendeeDao.updateAttendeeStatus).toHaveBeenCalledWith(
      2,
      'CANCELLED',
      expect.anything()
    );
    expect(mockedAttendeeDao.decrementAttendeeCount).not.toHaveBeenCalled();
    expect(mockedAttendeeDao.findEarliestWaitlist).not.toHaveBeenCalled();
    expect(mockedAttendeeDao.createAuditLog).toHaveBeenCalled();
    expect(result.status).toBe('CANCELLED');
  });

  it('promotes first waitlisted when cancelling CONFIRMED with waitlist', async () => {
    const waitlistUser = { id: 10, eventId: 1, userId: 10, status: 'WAITLIST' };
    mockedStateMachine.canTransition.mockReturnValue(true);
    mockedAttendeeDao.findAttendeeByUserAndEvent.mockResolvedValue(
      mockConfirmed
    );
    mockedAttendeeDao.updateAttendeeStatus
      .mockResolvedValueOnce({ ...mockConfirmed, status: 'CANCELLED' }) // cancel
      .mockResolvedValueOnce({ ...waitlistUser, status: 'CONFIRMED' }); // promote
    mockedAttendeeDao.decrementAttendeeCount.mockResolvedValue({});
    mockedAttendeeDao.createAuditLog.mockResolvedValue({});
    mockedAttendeeDao.findEarliestWaitlist.mockResolvedValue(waitlistUser);
    mockedAttendeeDao.incrementAttendeeCount.mockResolvedValue({});

    await eventAttendeeService.cancel(1, 1);

    // updateAttendeeStatus called twice: cancel + promote
    expect(mockedAttendeeDao.updateAttendeeStatus).toHaveBeenCalledTimes(2);
    expect(mockedAttendeeDao.updateAttendeeStatus).toHaveBeenNthCalledWith(
      1,
      1,
      'CANCELLED',
      expect.anything()
    );
    expect(mockedAttendeeDao.updateAttendeeStatus).toHaveBeenNthCalledWith(
      2,
      10,
      'CONFIRMED',
      expect.anything()
    );
    expect(mockedAttendeeDao.decrementAttendeeCount).toHaveBeenCalledWith(
      1,
      expect.anything()
    );
    expect(mockedAttendeeDao.incrementAttendeeCount).toHaveBeenCalledWith(
      1,
      expect.anything()
    );
  });
});
