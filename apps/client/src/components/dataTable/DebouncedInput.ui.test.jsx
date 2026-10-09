import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DebouncedInput } from './DebouncedInput';

describe('DebouncedInput - UI snapshot', () => {
  it('renders the input with a fixed value', () => {
    const { container } = render(
      <DebouncedInput
        value="frozen value"
        onChange={() => {}}
        placeholder="Search items"
        type="text"
      />
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <input
        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Search items"
        type="text"
        value="frozen value"
      />
    `,
      'debounced input showing its fixed value'
    );
  });
});
