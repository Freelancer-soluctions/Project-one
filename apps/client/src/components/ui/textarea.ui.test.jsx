import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea - UI snapshot', () => {
  it('renders an empty textarea', () => {
    const { container } = render(<Textarea placeholder="Write a note..." />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <textarea
        class="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Write a note..."
      />
    `,
      'textarea with placeholder'
    );
  });
});
