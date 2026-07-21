import { describe, it, expect } from 'vitest';
import { sanitizePrismaMessage } from '../../src/utils/prisma/sanitizePrismaMessage.js';

describe('sanitizePrismaMessage', () => {
  it('should return safe message for P2002', () => {
    const err = { code: 'P2002', message: 'Unique constraint failed on email' };
    expect(sanitizePrismaMessage(err)).toBe('A record with this value already exists.');
  });

  it('should return safe message for P2025', () => {
    const err = { code: 'P2025', message: 'Record to update not found' };
    expect(sanitizePrismaMessage(err)).toBe('The record you are trying to modify was not found.');
  });

  it('should return default message for unknown code', () => {
    const err = { code: 'P9999', message: 'Something weird' };
    expect(sanitizePrismaMessage(err)).toBe('An unexpected database error occurred.');
  });

  it('should include original message when includeOriginal is true', () => {
    const err = { code: 'P2002', message: 'Unique constraint failed on email' };
    const result = sanitizePrismaMessage(err, true);
    expect(result).toContain('[DEV]');
    expect(result).toContain('Unique constraint failed on email');
  });

  it('should not include original message when includeOriginal is false', () => {
    const err = { code: 'P2002', message: 'Unique constraint failed on email' };
    const result = sanitizePrismaMessage(err, false);
    expect(result).not.toContain('[DEV]');
    expect(result).not.toContain('Unique constraint failed');
  });

  it('should return safe message for P2000 value too long', () => {
    const err = { code: 'P2000', message: 'Value too long' };
    expect(sanitizePrismaMessage(err)).toBe('A field value exceeds the maximum allowed length.');
  });

  it('should return safe message for P2034 transaction conflict', () => {
    const err = { code: 'P2034', message: 'Transaction conflict' };
    expect(sanitizePrismaMessage(err)).toBe('A transaction conflict occurred. Please retry the operation.');
  });

  it('should handle missing code property gracefully', () => {
    const err = { message: 'No code here' };
    expect(sanitizePrismaMessage(err)).toBe('An unexpected database error occurred.');
  });
});