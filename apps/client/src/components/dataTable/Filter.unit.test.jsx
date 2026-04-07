import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Filter } from './Filter';

describe('Filter - Unit', () => {
  it('renders DebouncedInput with placeholder Search... when filterVariant is not range or select', () => {
    const mockColumn = {
      getFilterValue: () => '',
      setFilterValue: vi.fn(),
      columnDef: {
        meta: undefined,
      },
    };

    render(<Filter column={mockColumn} />);

    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
  });
});
