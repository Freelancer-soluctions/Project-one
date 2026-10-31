import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFetch } from './useFetch';

describe('useFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps loading until the request settles, then exposes its data', async () => {
    let resolveResponse;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveResponse = resolve;
          })
      )
    );

    const { result } = renderHook(() => useFetch('/api/items'));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveResponse({ json: async () => [{ id: 1 }] });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([{ id: 1 }]);
    expect(result.current.error).toBeNull();
  });

  it('exposes a non-abort request error', async () => {
    const requestError = new Error('network unavailable');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(requestError))
    );

    const { result } = renderHook(() => useFetch('/api/items'));

    await act(async () => {});

    expect(result.current.error).toBe(requestError);
    expect(result.current.loading).toBe(false);
  });

  it('logs an aborted request and allows the request to settle', async () => {
    let rejectResponse;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve, reject) => {
            rejectResponse = reject;
          })
      )
    );
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { result } = renderHook(() => useFetch('/api/items'));

    await act(async () => {
      rejectResponse(
        Object.assign(new Error('aborted'), { name: 'AbortError' })
      );
    });

    expect(log).toHaveBeenCalledWith('Fetch aborted request cancelled');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
