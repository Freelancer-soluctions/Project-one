import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLoadingState } from './useLoadingState';

describe('useLoadingState', () => {
  it('aggregates loading and fetching flags from all query states', () => {
    const { result } = renderHook(() =>
      useLoadingState([
        { isLoading: false, isFetching: true },
        { isLoading: true, isFetching: false },
      ])
    );

    expect(result.current).toEqual({ isLoading: true, isFetching: true });
  });

  it('returns false flags for an empty list and ignores null entries', () => {
    const { result } = renderHook(() => useLoadingState([null, undefined]));

    expect(result.current).toEqual({ isLoading: false, isFetching: false });
  });
});
