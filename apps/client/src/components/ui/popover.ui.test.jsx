import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

describe('Popover - UI snapshot', () => {
  it('renders the closed trigger subtree', () => {
    const { container } = render(
      <Popover>
        <PopoverTrigger>Open popover</PopoverTrigger>
        <PopoverContent>Popover body</PopoverContent>
      </Popover>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <button
        aria-expanded="false"
        aria-haspopup="dialog"
        data-state="closed"
        type="button"
      >
        Open popover
      </button>
    `,
      'popover trigger in the closed state'
    );
  });
});
