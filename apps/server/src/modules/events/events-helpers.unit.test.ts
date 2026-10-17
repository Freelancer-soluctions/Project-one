import { describe, it, expect, vi } from 'vitest';

// Mock db to prevent PrismaClient instantiation (helpers don't need DB)
vi.mock('../../config/db.js', () => ({
  prisma: {},
  Prisma: {},
}));

import { timeStrToDate, formatTime } from './service.js';

describe('Events Time Helpers', () => {
  describe('timeStrToDate', () => {
    it('should convert "09:30" to Date with correct hours and minutes', () => {
      const result = timeStrToDate('09:30');

      expect(result).toBeInstanceOf(Date);
      expect(result.getUTCHours()).toBe(9);
      expect(result.getUTCMinutes()).toBe(30);
      expect(result.getUTCSeconds()).toBe(0);
      // Verify it's on the epoch date (1970-01-01)
      expect(result.getUTCFullYear()).toBe(1970);
      expect(result.getUTCMonth()).toBe(0);
      expect(result.getUTCDate()).toBe(1);
    });

    it('should handle midnight "00:00" correctly', () => {
      const result = timeStrToDate('00:00');

      expect(result).toBeInstanceOf(Date);
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCSeconds()).toBe(0);
    });

    it('should handle end of day "23:59" correctly', () => {
      const result = timeStrToDate('23:59');

      expect(result).toBeInstanceOf(Date);
      expect(result.getUTCHours()).toBe(23);
      expect(result.getUTCMinutes()).toBe(59);
      expect(result.getUTCSeconds()).toBe(0);
    });

    it('should handle single-digit hours with leading zero "05:30"', () => {
      const result = timeStrToDate('05:30');

      expect(result.getUTCHours()).toBe(5);
      expect(result.getUTCMinutes()).toBe(30);
    });

    it('should handle single-digit minutes with leading zero "12:05"', () => {
      const result = timeStrToDate('12:05');

      expect(result.getUTCHours()).toBe(12);
      expect(result.getUTCMinutes()).toBe(5);
    });

    it('should handle noon "12:00" correctly', () => {
      const result = timeStrToDate('12:00');

      expect(result.getUTCHours()).toBe(12);
      expect(result.getUTCMinutes()).toBe(0);
    });

    it('should handle various valid time formats', () => {
      const testCases = [
        { input: '00:00', hours: 0, minutes: 0 },
        { input: '01:00', hours: 1, minutes: 0 },
        { input: '10:05', hours: 10, minutes: 5 },
        { input: '13:30', hours: 13, minutes: 30 },
        { input: '23:59', hours: 23, minutes: 59 },
      ];

      for (const { input, hours, minutes } of testCases) {
        const result = timeStrToDate(input);
        expect(result.getUTCHours()).toBe(hours);
        expect(result.getUTCMinutes()).toBe(minutes);
      }
    });
  });

  describe('formatTime', () => {
    it('should format Date to "HH:mm" string with proper padding', () => {
      const date = new Date('1970-01-01T09:05:00Z');
      const result = formatTime(date);

      expect(result).toBe('09:05');
    });

    it('should handle single-digit hours and minutes with leading zeros', () => {
      const date = new Date('1970-01-01T05:03:00Z');
      const result = formatTime(date);

      expect(result).toBe('05:03');
    });

    it('should handle midnight correctly', () => {
      const date = new Date('1970-01-01T00:00:00Z');
      const result = formatTime(date);

      expect(result).toBe('00:00');
    });

    it('should handle end of day correctly', () => {
      const date = new Date('1970-01-01T23:59:00Z');
      const result = formatTime(date);

      expect(result).toBe('23:59');
    });

    it('should handle noon correctly', () => {
      const date = new Date('1970-01-01T12:00:00Z');
      const result = formatTime(date);

      expect(result).toBe('12:00');
    });

    it('should ignore seconds and only return HH:mm', () => {
      const date = new Date('1970-01-01T15:30:45Z');
      const result = formatTime(date);

      expect(result).toBe('15:30');
    });

    it('should handle various times correctly', () => {
      const testCases = [
        { input: new Date('1970-01-01T00:00:00Z'), expected: '00:00' },
        { input: new Date('1970-01-01T01:05:00Z'), expected: '01:05' },
        { input: new Date('1970-01-01T09:00:00Z'), expected: '09:00' },
        { input: new Date('1970-01-01T12:30:00Z'), expected: '12:30' },
        { input: new Date('1970-01-01T23:59:00Z'), expected: '23:59' },
      ];

      for (const { input, expected } of testCases) {
        expect(formatTime(input)).toBe(expected);
      }
    });
  });

  describe('Round-trip: timeStrToDate -> formatTime', () => {
    it('should preserve time when converting back and forth', () => {
      const testTimes = ['00:00', '09:30', '12:00', '15:45', '23:59'];

      for (const timeStr of testTimes) {
        const date = timeStrToDate(timeStr);
        const formatted = formatTime(date);
        expect(formatted).toBe(timeStr);
      }
    });
  });
});
