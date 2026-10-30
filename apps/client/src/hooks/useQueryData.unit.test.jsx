import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useQueryData } from './useQueryData';

describe('useQueryData', () => {
  it('unwraps response data and preserves query status', () => {
    const error = new Error('request failed');
    const { result } = renderHook(() =>
      useQueryData({
        data: { data: ['item'] },
        isLoading: false,
        isFetching: true,
        isError: true,
        error,
      })
    );

    expect(result.current).toEqual({
      data: ['item'],
      isLoading: false,
      isFetching: true,
      isError: true,
      error,
    });
  });

  it('uses defaults when the query result or nested data is missing', () => {
    const defaultValue = { items: [] };
    const { result } = renderHook(() => useQueryData(undefined, defaultValue));

    expect(result.current).toEqual({
      data: defaultValue,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: undefined,
    });
  });
});
