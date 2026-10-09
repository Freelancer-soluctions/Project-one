import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Pagination } from './Pagination';

// Fixed fixture: page 2 of 5 (pageIndex is 0-based), 10 rows per page.
const FIXTURE_TABLE = {
  firstPage: () => {},
  previousPage: () => {},
  nextPage: () => {},
  lastPage: () => {},
  getCanPreviousPage: () => true,
  getCanNextPage: () => true,
  getState: () => ({ pagination: { pageIndex: 1, pageSize: 10 } }),
  getPageCount: () => 5,
  setPageIndex: () => {},
  setPageSize: () => {},
  getRowModel: () => ({ rows: new Array(10) }),
  getRowCount: () => 50,
};

describe('Pagination - UI snapshot', () => {
  it('renders the pager controls fixed on page 2 of 5', () => {
    const { container } = render(<Pagination table={FIXTURE_TABLE} />);
    expect(container.querySelector('div.flex.flex-wrap')).toMatchInlineSnapshot(
      `
      <div
        class="flex flex-wrap items-center gap-2"
      >
        <button
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 p-1 border rounded"
        >
          &lt;&lt;
        </button>
        <button
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 p-1 border rounded"
        >
          &lt;
        </button>
        <button
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 p-1 border rounded"
        >
          &gt;
        </button>
        <button
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 p-1 border rounded"
        >
          &gt;&gt;
        </button>
        <span
          class="flex items-center gap-1"
        >
          <div>
            Page
          </div>
          <strong>
            2
             of
             
            5
          </strong>
        </span>
        <span
          class="flex items-center gap-1"
        >
          | Go to page:
          <input
            class="border p-1 rounded w-16"
            max="5"
            min="1"
            type="number"
            value="2"
          />
        </span>
        <select>
          <option
            value="10"
          >
            Show 
            10
          </option>
          <option
            value="20"
          >
            Show 
            20
          </option>
          <option
            value="30"
          >
            Show 
            30
          </option>
          <option
            value="40"
          >
            Show 
            40
          </option>
          <option
            value="50"
          >
            Show 
            50
          </option>
        </select>
      </div>
    `,
      'pager controls fixed on page 2 of 5 with the page-size select'
    );
  });
});
