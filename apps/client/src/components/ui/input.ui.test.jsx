import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input } from '@/components/ui/input';

describe('Input - UI snapshot', () => {
  it('renders a text input with placeholder', () => {
    const { container } = render(
      <Input type="text" placeholder="Search..." defaultValue="" />
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <input
        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Search..."
        type="text"
        value=""
      />
    `,
      'text input with placeholder'
    );
  });
});
