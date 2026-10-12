import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Filter } from './Filter';

const TEXT_COLUMN = {
  getFilterValue: () => 'frozen filter',
  setFilterValue: () => {},
  columnDef: { meta: undefined },
};

describe('Filter - UI snapshot', () => {
  it('renders the text filter input', () => {
    const { container } = render(<Filter column={TEXT_COLUMN} />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <input
        class="flex h-9 border-input bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full border rounded shadow"
        placeholder="Search..."
        type="text"
        value="frozen filter"
      />
    `,
      'text filter input with the frozen filter value'
    );
  });
});
