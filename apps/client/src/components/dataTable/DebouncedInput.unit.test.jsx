import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { DebouncedInput } from './DebouncedInput';

describe('DebouncedInput - Unit', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('debounces onChange', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DebouncedInput value="foo" onChange={onChange} />
    );
    const input = container.querySelector('input');
    fireEvent.change(input, { target: { value: 'bar' } });
    vi.advanceTimersByTime(500);
    expect(onChange).toHaveBeenCalledWith('bar');
  });
});
