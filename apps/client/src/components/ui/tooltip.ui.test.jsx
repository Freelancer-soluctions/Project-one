import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

describe('Tooltip - UI snapshot', () => {
  it('renders the closed trigger subtree (content stays in its portal)', () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <button
        data-state="closed"
      >
        Hover me
      </button>
    `,
      'tooltip trigger in the closed state'
    );
  });
});
