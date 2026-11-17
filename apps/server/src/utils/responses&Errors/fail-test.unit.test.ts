import { describe, it, expect } from 'vitest';

describe('deliberate failure for smart-test-ordering validation', () => {
  it('this test always fails', () => {
    expect(true).toBe(false);
  });
});
