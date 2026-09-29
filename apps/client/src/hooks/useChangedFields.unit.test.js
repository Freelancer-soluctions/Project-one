import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { deepEqual, useChangedFields } from '@/hooks/useChangedFields';

describe('deepEqual', () => {
  it('returns true for identical primitives', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'a')).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
  });

  it('returns false for different primitives', () => {
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual('a', 'b')).toBe(false);
    expect(deepEqual(null, undefined)).toBe(false);
  });

  it('treats NaN as equal to NaN', () => {
    expect(deepEqual(NaN, NaN)).toBe(true);
  });

  it('compares dates by timestamp', () => {
    expect(deepEqual(new Date('2026-01-01'), new Date('2026-01-01'))).toBe(
      true
    );
    expect(deepEqual(new Date('2026-01-01'), new Date('2027-01-01'))).toBe(
      false
    );
  });

  it('compares arrays element-wise', () => {
    expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual([1], [1, 2])).toBe(false);
  });

  it('compares objects recursively', () => {
    expect(deepEqual({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });
});

describe('useChangedFields', () => {
  it('starts with no changes', () => {
    const { result } = renderHook(() => useChangedFields({ a: 1, b: 'x' }));
    expect(result.current.values).toEqual({ a: 1, b: 'x' });
    expect(result.current.changedFields).toEqual({});
    expect(result.current.hasChanges).toBe(false);
  });

  it('detects a changed scalar field', () => {
    const { result } = renderHook(() => useChangedFields({ a: 1, b: 'x' }));
    act(() => result.current.setField('a', 2));
    expect(result.current.changedFields).toEqual({ a: 2 });
    expect(result.current.hasChanges).toBe(true);
  });

  it('ignores fields set back to their original value', () => {
    const { result } = renderHook(() => useChangedFields({ a: 1 }));
    act(() => {
      result.current.setField('a', 2);
      result.current.setField('a', 1);
    });
    expect(result.current.changedFields).toEqual({});
  });

  it('detects changed nested objects and arrays deeply', () => {
    const { result } = renderHook(() =>
      useChangedFields({ tags: ['a', 'b'], meta: { x: 1 } })
    );
    act(() => result.current.setField('meta', { x: 2 }));
    expect(result.current.changedFields).toEqual({ meta: { x: 2 } });
    act(() => result.current.setField('tags', ['a', 'b']));
    expect(result.current.changedFields).toEqual({ meta: { x: 2 } });
  });

  it('reset() re-seeds to the initial values', () => {
    const { result } = renderHook(() => useChangedFields({ a: 1 }));
    act(() => result.current.setField('a', 9));
    act(() => result.current.reset());
    expect(result.current.values).toEqual({ a: 1 });
    expect(result.current.hasChanges).toBe(false);
  });
});
