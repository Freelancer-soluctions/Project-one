import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CellWithTooltip } from './cellWithTooltip';

const MOCK_CELL = {
  column: { columnDef: { cell: () => 'Frozen cell content' } },
  getContext: () => ({}),
};

describe('cellWithTooltip - UI snapshot', () => {
  it('renders the closed trigger with truncated content', () => {
    const { container } = render(
      <TooltipProvider>
        <CellWithTooltip cell={MOCK_CELL} />
      </TooltipProvider>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="truncate"
        data-state="closed"
      >
        Frozen cell content
      </div>
    `,
      'tooltip trigger with truncated cell content in the closed state'
    );
  });
});
