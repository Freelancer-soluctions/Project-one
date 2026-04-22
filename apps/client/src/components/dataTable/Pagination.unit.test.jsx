import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from './Pagination';

const createMockTable = (overrides = {}) => ({
  firstPage: vi.fn(),
  previousPage: vi.fn(),
  nextPage: vi.fn(),
  lastPage: vi.fn(),
  getCanPreviousPage: () => true,
  getCanNextPage: () => true,
  getState: () => ({ pagination: { pageIndex: 0, pageSize: 10 } }),
  getPageCount: () => 3,
  getRowModel: () => ({ rows: [] }),
  getRowCount: () => 0,
  setPageIndex: vi.fn(),
  setPageSize: vi.fn(),
  ...overrides,
});

describe('Pagination - Unit', () => {
  it('renders basic pagination controls', () => {
    const mockTable = createMockTable();
    render(<Pagination table={mockTable} />);
    expect(screen.getByText(/Page/)).toBeInTheDocument();
  });

  it('renders showing rows information', () => {
    const mockTable = createMockTable({
      getRowModel: () => ({ rows: [] }),
      getRowCount: () => 0,
    });
    render(<Pagination table={mockTable} />);
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByText(/0 of 0 Rows/)).toBeInTheDocument();
  });
});
