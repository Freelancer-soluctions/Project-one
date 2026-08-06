import { describe, it, expect } from 'vitest';
import {
  EventsCreateSchema,
  EventsUpdateSchema,
} from './schemas/events.joi.js';

describe('Events Joi Validation Schemas', () => {
  describe('EventsCreateSchema', () => {
    const validBase = {
      title: 'Test Event',
      description: 'Test Description',
      speaker: 'John Doe',
      startTime: '09:00',
      endTime: '17:00',
      eventDate: '2025-01-15',
      type: 1,
      modality: 'IN_PERSON',
      location: 'Main Hall',
    };

    it('should validate a valid event creation payload', () => {
      const { error, value } = EventsCreateSchema.validate(validBase);
      expect(error).toBeUndefined();
      // Joi coerces eventDate string to Date object
      expect(value.eventDate).toBeInstanceOf(Date);
      expect(value.title).toBe('Test Event');
      expect(value.startTime).toBe('09:00');
      expect(value.endTime).toBe('17:00');
      expect(value.modality).toBe('IN_PERSON');
      expect(value.location).toBe('Main Hall');
    });

    it('should reject invalid HH:mm format for startTime', () => {
      // Non-empty invalid formats — should trigger pattern error
      const invalidFormats = [
        { ...validBase, startTime: '9:00' }, // missing leading zero
        { ...validBase, startTime: '24:00' }, // invalid hour
        { ...validBase, startTime: '12:60' }, // invalid minute
        { ...validBase, startTime: '12-00' }, // wrong separator
        { ...validBase, startTime: 'abc' }, // non-time string
      ];

      for (const payload of invalidFormats) {
        const { error } = EventsCreateSchema.validate(payload);
        expect(
          error,
          `Expected error for startTime: "${payload.startTime}"`
        ).toBeDefined();
        expect(error.details.some((d) => d.message.includes('HH:mm'))).toBe(
          true
        );
      }
    });

    it('should reject empty startTime as required field', () => {
      const payload = { ...validBase, startTime: '' };
      const { error } = EventsCreateSchema.validate(payload);
      expect(error).toBeDefined();
    });

    it('should reject invalid HH:mm format for endTime', () => {
      const invalidFormats = [
        { ...validBase, endTime: '9:00' },
        { ...validBase, endTime: '24:00' },
        { ...validBase, endTime: '12:60' },
        { ...validBase, endTime: '12-00' },
        { ...validBase, endTime: 'abc' },
      ];

      for (const payload of invalidFormats) {
        const { error } = EventsCreateSchema.validate(payload);
        expect(
          error,
          `Expected error for endTime: "${payload.endTime}"`
        ).toBeDefined();
        expect(error.details.some((d) => d.message.includes('HH:mm'))).toBe(
          true
        );
      }
    });

    it('should reject when startTime >= endTime', () => {
      const invalidPayloads = [
        { ...validBase, startTime: '10:00', endTime: '09:00' }, // start after end
        { ...validBase, startTime: '10:00', endTime: '10:00' }, // start equals end
      ];

      for (const payload of invalidPayloads) {
        const { error } = EventsCreateSchema.validate(payload);
        expect(error).toBeDefined();
        expect(
          error.details.some((d) =>
            d.message.includes('startTime must be earlier than endTime')
          )
        ).toBe(true);
      }
    });

    it('should accept valid edge case times', () => {
      const edgeCases = [
        { ...validBase, startTime: '00:00', endTime: '23:59' }, // full day
        { ...validBase, startTime: '00:00', endTime: '00:01' }, // midnight start
        { ...validBase, startTime: '23:58', endTime: '23:59' }, // end of day
      ];

      for (const payload of edgeCases) {
        const { error } = EventsCreateSchema.validate(payload);
        expect(error).toBeUndefined();
      }
    });

    it('should convert empty string speaker to undefined', () => {
      const payload = { ...validBase, speaker: '' };
      const { error, value } = EventsCreateSchema.validate(payload);
      expect(error).toBeUndefined();
      expect(value.speaker).toBeUndefined();
    });

    it('should accept omitted speaker field', () => {
      // eslint-disable-next-line no-unused-vars
      const { speaker: _speaker, ...payload } = validBase;
      const { error, value } = EventsCreateSchema.validate(payload);
      expect(error).toBeUndefined();
      expect(value.speaker).toBeUndefined();
    });

    it('should reject speaker longer than 20 characters', () => {
      const payload = { ...validBase, speaker: 'A'.repeat(21) };
      const { error } = EventsCreateSchema.validate(payload);
      expect(error).toBeDefined();
      expect(error.details.some((d) => d.message.includes('speaker'))).toBe(
        true
      );
    });

    it('should reject title longer than 50 characters', () => {
      const payload = { ...validBase, title: 'A'.repeat(51) };
      const { error } = EventsCreateSchema.validate(payload);
      expect(error).toBeDefined();
    });

    it('should reject description longer than 200 characters', () => {
      const payload = { ...validBase, description: 'A'.repeat(201) };
      const { error } = EventsCreateSchema.validate(payload);
      expect(error).toBeDefined();
    });

    it('should reject unknown fields (allowUnknown: false)', () => {
      const payload = { ...validBase, unknownField: 'test' };
      const { error } = EventsCreateSchema.validate(payload);
      expect(error).toBeDefined();
    });

    it('should reject missing required fields', () => {
      const requiredFields = [
        'title',
        'description',
        'startTime',
        'endTime',
        'eventDate',
        'type',
      ];
      for (const field of requiredFields) {
        // eslint-disable-next-line no-unused-vars
        const { [field]: _unused, ...payload } = validBase;
        const { error } = EventsCreateSchema.validate(payload);
        expect(error).toBeDefined();
        expect(error.details.some((d) => d.message.includes(field))).toBe(true);
      }
    });
  });

  describe('EventsUpdateSchema', () => {
    const validUpdateBase = {
      title: 'Updated Event',
      description: 'Updated Description',
      speaker: 'Jane Doe',
      startTime: '10:00',
      endTime: '18:00',
      eventDate: '2025-01-15',
      type: 2,
    };

    it('should validate a valid partial update payload', () => {
      const partialPayload = { title: 'New Title' };
      const { error } = EventsUpdateSchema.validate(partialPayload);
      expect(error).toBeUndefined();
    });

    it('should validate a valid full update payload', () => {
      const { error } = EventsUpdateSchema.validate(validUpdateBase);
      expect(error).toBeUndefined();
    });

    it('should reject invalid HH:mm format for startTime in update', () => {
      const invalidPayloads = [
        { ...validUpdateBase, startTime: '9:00' },
        { ...validUpdateBase, startTime: '24:00' },
        { ...validUpdateBase, startTime: '12:60' },
        { ...validUpdateBase, startTime: 'abc' },
      ];

      for (const payload of invalidPayloads) {
        const { error } = EventsUpdateSchema.validate(payload);
        expect(error).toBeDefined();
        expect(error.details.some((d) => d.message.includes('HH:mm'))).toBe(
          true
        );
      }
    });

    it('should reject invalid HH:mm format for endTime in update', () => {
      const invalidPayloads = [
        { ...validUpdateBase, endTime: '9:00' },
        { ...validUpdateBase, endTime: '24:00' },
        { ...validUpdateBase, endTime: '12:60' },
        { ...validUpdateBase, endTime: 'abc' },
      ];

      for (const payload of invalidPayloads) {
        const { error } = EventsUpdateSchema.validate(payload);
        expect(error).toBeDefined();
        expect(error.details.some((d) => d.message.includes('HH:mm'))).toBe(
          true
        );
      }
    });

    it('should reject when startTime >= endTime (both provided)', () => {
      const invalidPayloads = [
        { ...validUpdateBase, startTime: '10:00', endTime: '09:00' },
        { ...validUpdateBase, startTime: '10:00', endTime: '10:00' },
      ];

      for (const payload of invalidPayloads) {
        const { error } = EventsUpdateSchema.validate(payload);
        expect(error).toBeDefined();
        expect(
          error.details.some((d) =>
            d.message.includes('startTime must be earlier than endTime')
          )
        ).toBe(true);
      }
    });

    it('should allow partial update with only startTime (no cross-field check)', () => {
      const payload = { startTime: '10:00' };
      const { error } = EventsUpdateSchema.validate(payload);
      expect(error).toBeUndefined();
    });

    it('should allow partial update with only endTime (no cross-field check)', () => {
      const payload = { endTime: '18:00' };
      const { error } = EventsUpdateSchema.validate(payload);
      expect(error).toBeUndefined();
    });

    it('should allow empty string for speaker in update', () => {
      const payload = { speaker: '' };
      const { error, value } = EventsUpdateSchema.validate(payload);
      expect(error).toBeUndefined();
      // Note: Update schema uses .allow('') not .empty(''), so empty string is kept
      expect(value.speaker).toBe('');
    });

    it('should reject speaker longer than 20 characters', () => {
      const payload = { speaker: 'A'.repeat(21) };
      const { error } = EventsUpdateSchema.validate(payload);
      expect(error).toBeDefined();
    });

    it('should reject unknown fields (allowUnknown: false)', () => {
      const payload = { ...validUpdateBase, unknownField: 'test' };
      const { error } = EventsUpdateSchema.validate(payload);
      expect(error).toBeDefined();
    });
  });
});
