/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';

const handleCatchErrorAsync = (await import('./handleCatchErrorAsync.js'))
  .default;

describe('handleCatchErrorAsync', () => {
  it('should call fn and not call next on success', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const req = {} as any;
    const res = {} as any;
    const next = vi.fn();

    const handler = handleCatchErrorAsync(fn);
    handler(req, res, next);

    // Wait for microtask
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with error when fn rejects', async () => {
    const error = new Error('test error');
    const fn = vi.fn().mockRejectedValue(error);
    const req = {} as any;
    const res = {} as any;
    const next = vi.fn();

    const handler = handleCatchErrorAsync(fn);
    handler(req, res, next);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should call next with unknown error when fn rejects with non-Error', async () => {
    const fn = vi.fn().mockRejectedValue('string error');
    const req = {} as any;
    const res = {} as any;
    const next = vi.fn();

    const handler = handleCatchErrorAsync(fn);
    handler(req, res, next);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(next).toHaveBeenCalledWith('string error');
  });
});
