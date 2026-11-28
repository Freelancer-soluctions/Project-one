import { describe, it, expect } from 'vitest';
import { escapeLike } from './escapeLike.js';

describe('escapeLike', () => {
  it('returns plain text unchanged', () => {
    expect(escapeLike('Ana')).toBe('Ana');
  });

  it('escapes the LIKE wildcards % and _', () => {
    expect(escapeLike('100%')).toBe('100\\%');
    expect(escapeLike('a_b')).toBe('a\\_b');
  });

  it('escapes the escape character itself', () => {
    expect(escapeLike('a\\b')).toBe('a\\\\b');
  });
});
