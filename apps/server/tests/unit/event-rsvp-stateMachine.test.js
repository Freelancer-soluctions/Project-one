import { describe, it, expect } from 'vitest';
import { canTransition, getAllowedNextStates } from '../../src/modules/events/stateMachine.js';

describe('Event RSVP State Machine', () => {
  describe('canTransition', () => {
    // Test all valid transitions from design.md matrix:
    // null → CONFIRMED ✓, null → WAITLIST ✓, null → CANCELLED ✗
    it('null → CONFIRMED is valid (new registration with capacity)', () => {
      expect(canTransition(null, 'CONFIRMED')).toBe(true);
    });

    it('null → WAITLIST is valid (new registration at capacity)', () => {
      expect(canTransition(null, 'WAITLIST')).toBe(true);
    });

    it('null → CANCELLED is invalid', () => {
      expect(canTransition(null, 'CANCELLED')).toBe(false);
    });

    // CONFIRMED → CANCELLED ✓ (cancel), others ✗
    it('CONFIRMED → CANCELLED is valid (cancel registration)', () => {
      expect(canTransition('CONFIRMED', 'CANCELLED')).toBe(true);
    });

    it('CONFIRMED → CONFIRMED is invalid', () => {
      expect(canTransition('CONFIRMED', 'CONFIRMED')).toBe(false);
    });

    it('CONFIRMED → WAITLIST is invalid', () => {
      expect(canTransition('CONFIRMED', 'WAITLIST')).toBe(false);
    });

    // WAITLIST → CANCELLED ✓, WAITLIST → CONFIRMED ✓ (promote)
    it('WAITLIST → CANCELLED is valid (cancel waitlist)', () => {
      expect(canTransition('WAITLIST', 'CANCELLED')).toBe(true);
    });

    it('WAITLIST → CONFIRMED is valid (promote from waitlist)', () => {
      expect(canTransition('WAITLIST', 'CONFIRMED')).toBe(true);
    });

    it('WAITLIST → WAITLIST is invalid', () => {
      expect(canTransition('WAITLIST', 'WAITLIST')).toBe(false);
    });

    // CANCELLED → CONFIRMED ✓, CANCELLED → WAITLIST ✓ (re-register)
    it('CANCELLED → CONFIRMED is valid (re-register with space)', () => {
      expect(canTransition('CANCELLED', 'CONFIRMED')).toBe(true);
    });

    it('CANCELLED → WAITLIST is valid (re-register at capacity)', () => {
      expect(canTransition('CANCELLED', 'WAITLIST')).toBe(true);
    });

    it('CANCELLED → CANCELLED is invalid', () => {
      expect(canTransition('CANCELLED', 'CANCELLED')).toBe(false);
    });

    // Edge cases
    it('handles undefined as null', () => {
      expect(canTransition(undefined, 'CONFIRMED')).toBe(true);
    });

    it('returns false for unknown status', () => {
      expect(canTransition('UNKNOWN', 'CONFIRMED')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(canTransition('', 'CONFIRMED')).toBe(false);
    });
  });

  describe('getAllowedNextStates', () => {
    it('null returns [CONFIRMED, WAITLIST]', () => {
      expect(getAllowedNextStates(null)).toEqual(['CONFIRMED', 'WAITLIST']);
    });

    it('CONFIRMED returns [CANCELLED]', () => {
      expect(getAllowedNextStates('CONFIRMED')).toEqual(['CANCELLED']);
    });

    it('WAITLIST returns [CANCELLED, CONFIRMED]', () => {
      expect(getAllowedNextStates('WAITLIST')).toEqual(['CANCELLED', 'CONFIRMED']);
    });

    it('CANCELLED returns [CONFIRMED, WAITLIST]', () => {
      expect(getAllowedNextStates('CANCELLED')).toEqual(['CONFIRMED', 'WAITLIST']);
    });

    it('handles undefined as null', () => {
      expect(getAllowedNextStates(undefined)).toEqual(['CONFIRMED', 'WAITLIST']);
    });

    it('returns empty array for unknown status', () => {
      expect(getAllowedNextStates('UNKNOWN')).toEqual([]);
    });
  });
});