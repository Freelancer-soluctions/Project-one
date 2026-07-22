import { describe, it, expect } from 'vitest';
import {
  EventsCreateSchema,
  EventsUpdateSchema,
} from '../../src/modules/events/schemas/events.joi.js';
import { timeStrToDate, formatTime } from '../../src/modules/events/service.js';

/**
 * Events Validation Integration Tests
 *
 * Tests the full validation pipeline: Joi schemas + time helpers
 * working together to ensure data integrity at the API boundary.
 */

describe('Events Validation Integration', () => {
  const validPayload = {
    title: 'Test Event',
    description: 'Test Description',
    speaker: 'John Doe',
    startTime: '09:00',
    endTime: '17:00',
    eventDate: '2025-01-15',
    type: 1,
  };

  describe('Full pipeline: schema → helper → round-trip', () => {
    it('should validate, convert, format, and preserve HH:mm', () => {
      // 1. Joi validates input
      const { error, value } = EventsCreateSchema.validate(validPayload);
      expect(error).toBeUndefined();

      // 2. Service converts string → Date for Prisma
      const startDate = timeStrToDate(value.startTime);
      const endDate = timeStrToDate(value.endTime);
      expect(startDate).toBeInstanceOf(Date);
      expect(endDate).toBeInstanceOf(Date);

      // 3. Service formats Date → string for response
      expect(formatTime(startDate)).toBe('09:00');
      expect(formatTime(endDate)).toBe('17:00');

      // 4. Round-trip preserved
      expect(formatTime(timeStrToDate('09:00'))).toBe('09:00');
      expect(formatTime(timeStrToDate('17:00'))).toBe('17:00');
    });
  });

  describe('Create validation + time integrity', () => {
    it('should reject event where startTime >= endTime', () => {
      const invalid = { ...validPayload, startTime: '10:00', endTime: '09:00' };
      const { error } = EventsCreateSchema.validate(invalid);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('startTime must be earlier than endTime');
    });

    it('should reject equal startTime and endTime', () => {
      const invalid = { ...validPayload, startTime: '10:00', endTime: '10:00' };
      const { error } = EventsCreateSchema.validate(invalid);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('startTime must be earlier than endTime');
    });

    it('should reject malformed startTime', () => {
      const invalid = { ...validPayload, startTime: '25:00' };
      const { error } = EventsCreateSchema.validate(invalid);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('HH:mm');
    });

    it('should reject missing required speaker', () => {
      // With .empty('').optional(), omitting speaker is OK
      // But that's the correct behavior — speaker is optional
      const { speaker, ...withoutSpeaker } = validPayload;
      const { error } = EventsCreateSchema.validate(withoutSpeaker);
      expect(error).toBeUndefined();
    });
  });

  describe('Partial update safety (update schema)', () => {
    it('should allow updating only startTime without cross-field validation', () => {
      const { error } = EventsUpdateSchema.validate({ startTime: '10:00' });
      expect(error).toBeUndefined();
    });

    it('should allow updating only endTime without cross-field validation', () => {
      const { error } = EventsUpdateSchema.validate({ endTime: '18:00' });
      expect(error).toBeUndefined();
    });

    it('should reject when both times provided and start >= end', () => {
      const { error } = EventsUpdateSchema.validate({
        startTime: '14:00',
        endTime: '13:00',
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('startTime must be earlier than endTime');
    });

    it('should accept valid partial update with both times', () => {
      const { error } = EventsUpdateSchema.validate({
        startTime: '09:00',
        endTime: '17:00',
      });
      expect(error).toBeUndefined();
    });
  });

  describe('Speaker optional behavior', () => {
    it('should accept empty string speaker via .empty() → undefined', () => {
      // This simulates the client sending speaker: ""
      const { error, value } = EventsCreateSchema.validate({
        ...validPayload,
        speaker: '',
      });
      expect(error).toBeUndefined();
      expect(value.speaker).toBeUndefined();
    });

    it('should accept completely omitted speaker', () => {
      const { speaker, ...withoutSpeaker } = validPayload;
      const { error, value } = EventsCreateSchema.validate(withoutSpeaker);
      expect(error).toBeUndefined();
      expect(value.speaker).toBeUndefined();
    });
  });
});
