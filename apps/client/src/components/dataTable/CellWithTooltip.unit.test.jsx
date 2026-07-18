import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CellWithTooltip } from './cellWithTooltip';
import { TooltipProvider } from '@/components/ui/tooltip';

vi.mock('@tanstack/react-table', () => ({
  flexRender: vi.fn(() => 'CellContent'),
}));

describe('CellWithTooltip - Unit', () => {
  it('renders cell content', () => {
    const mockCell = {
      column: {
        columnDef: {
          cell: vi.fn(),
        },
      },
      getContext: vi.fn(),
    };

    render(
      <TooltipProvider>
        <CellWithTooltip cell={mockCell} />
      </TooltipProvider>
    );
    expect(screen.getByText('CellContent')).toBeInTheDocument();
  });
});
