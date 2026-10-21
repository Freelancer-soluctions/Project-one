import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { events, eventTypes, users } from '@prisma/client';

// Filas completas de las relaciones que el dao incluye en `getAllEvents`.
const eventTypeRow = (overrides: Partial<eventTypes> = {}): eventTypes => ({
  id: 1,
  code: 'T01',
  description: 'Test type',
  ...overrides,
});

const userRow = (overrides: Partial<users> = {}): users => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashed',
  address: null,
  birthday: new Date('1990-01-01T00:00:00.000Z'),
  city: null,
  isAdmin: false,
  picture: null,
  document: null,
  lastUpdatedBy: 1,
  lastUpdatedOn: null,
  roleId: 1,
  socialSecurity: '000000000',
  startDate: new Date('2024-01-01T00:00:00.000Z'),
  state: 'ACTIVE',
  statusId: 1,
  telephone: '000000000',
  zipcode: '00000',
  ...overrides,
});

// Fila completa del modelo `events`: los mocks tipados de Prisma exigen la forma completa.
const eventRow = (overrides: Partial<events> = {}): events => ({
  id: 1,
  title: 'Test Event',
  description: 'Test description',
  speaker: null,
  startTime: new Date('2024-01-01T10:00:00.000Z'),
  endTime: new Date('2024-01-01T11:00:00.000Z'),
  eventDate: new Date('2024-01-01T00:00:00.000Z'),
  modality: 'IN_PERSON',
  meetingUrl: null,
  location: null,
  createdBy: 1,
  createdOn: new Date('2024-01-01T00:00:00.000Z'),
  updatedOn: null,
  deletedAt: null,
  deletedBy: null,
  eventTypeId: 1,
  capacity: 10,
  attendeeCount: 0,
  ...overrides,
});

import * as eventService from './service.js';
import * as eventDao from './dao.js';
const mockedEventDao = vi.mocked(eventDao);

vi.mock('./dao.js', () => ({
  getAllEvents: vi.fn(),
}));

describe('Events Service – Combined Filters (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedEventDao.getAllEvents.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
  });

  // 5.1 — Each filter passed through
  describe('passes filter params to DAO', () => {
    it('passes type parameter', async () => {
      await eventService.getAllEvents({ type: 3 });
      expect(mockedEventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({ type: 3 })
      );
    });

    it('passes dateFrom as Date object', async () => {
      await eventService.getAllEvents({ dateFrom: '2025-01-01' });
      expect(mockedEventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({ dateFrom: expect.any(Date) })
      );
      const callArg = mockedEventDao.getAllEvents.mock.calls[0]![0];
      expect(callArg.dateFrom).toEqual(new Date('2025-01-01'));
    });

    it('passes dateTo as Date object', async () => {
      await eventService.getAllEvents({ dateTo: '2025-12-31' });
      expect(mockedEventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({ dateTo: expect.any(Date) })
      );
      const callArg = mockedEventDao.getAllEvents.mock.calls[0]![0];
      expect(callArg.dateTo).toEqual(new Date('2025-12-31'));
    });

    it('passes speaker parameter', async () => {
      await eventService.getAllEvents({ speaker: 'John Doe' });
      expect(mockedEventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({ speaker: 'John Doe' })
      );
    });

    it('passes status parameter', async () => {
      await eventService.getAllEvents({ status: 'upcoming' });
      expect(mockedEventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'upcoming' })
      );
    });

    it('passes searchQuery parameter', async () => {
      await eventService.getAllEvents({ searchQuery: 'tech' });
      expect(mockedEventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({ searchQuery: 'tech' })
      );
    });

    it('passes pagination and showDeleted', async () => {
      await eventService.getAllEvents({
        page: 2,
        limit: 10,
        showDeleted: true,
      });
      expect(mockedEventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 10,
          showDeleted: true,
        })
      );
    });

    it('passes all filters combined', async () => {
      await eventService.getAllEvents({
        type: 1,
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
        speaker: 'Smith',
        status: 'past',
        searchQuery: 'conference',
        page: 1,
        limit: 5,
        showDeleted: false,
      });
      expect(mockedEventDao.getAllEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 1,
          dateFrom: expect.any(Date),
          dateTo: expect.any(Date),
          speaker: 'Smith',
          status: 'past',
          searchQuery: 'conference',
          page: 1,
          pageSize: 5,
          showDeleted: false,
        })
      );
    });

    it('handles undefined filters gracefully', async () => {
      await eventService.getAllEvents({
        type: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        speaker: undefined,
        status: undefined,
      });
      const callArg = mockedEventDao.getAllEvents.mock.calls[0]![0];
      expect(callArg.type).toBeUndefined();
      expect(callArg.dateFrom).toBeUndefined();
      expect(callArg.dateTo).toBeUndefined();
      expect(callArg.speaker).toBeUndefined();
      expect(callArg.status).toBeUndefined();
    });
  });

  // 5.3 — Formats response times
  describe('formats response times', () => {
    it('converts startTime and endTime to HH:mm format', async () => {
      const mockEvent = {
        ...eventRow({
          id: 1,
          title: 'Test',
          startTime: new Date('1970-01-01T14:30:00.000Z'),
          endTime: new Date('1970-01-01T16:45:00.000Z'),
        }),
        eventTypes: eventTypeRow(),
        userEventCreated: userRow(),
      };
      mockedEventDao.getAllEvents.mockResolvedValue({
        data: [mockEvent],
        total: 1,
        page: 1,
        pageSize: 20,
      });

      const result = await eventService.getAllEvents({});

      expect(result.data[0]!.startTime).toBe('14:30');
      expect(result.data[0]!.endTime).toBe('16:45');
    });
  });
});
